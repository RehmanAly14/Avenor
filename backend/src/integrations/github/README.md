# GitHub Integration

This directory is Avenor's only connection to source control. It has two responsibilities that deliberately don't share credentials logic with anything else in the codebase:

1. **Connection** (`github-connection.*`, `github.oauth.js`) — let a user connect their own GitHub account and pick which repository a Project's autonomous fixes should target.
2. **PR flow** (`github.client.js`, `github.service.js`) — given an *approved* fix, create a branch, commit its files, and open a pull request against that repository.

```
Avenor PostgreSQL  =  application + metadata state
GitHub             =  source code + repository + PR lifecycle
AI                 =  investigation + reasoning + fix generation
Avenor             =  orchestration layer connecting all three
```

## Architecture decision: OAuth App, not a GitHub App

GitHub offers two integration models. Avenor uses an **OAuth App**:

| | OAuth App (used here) | GitHub App |
|---|---|---|
| Auth | `client_id`/`client_secret`, user authorizes, one user-scoped token | Private-key-signed JWT → short-lived installation tokens (need refresh) |
| Token lifetime | Doesn't expire by default (classic OAuth Apps) | ~1 hour, must be refreshed per API call session |
| Setup complexity | Two secrets | App registration, private key management, installation webhook handling |
| Fits this codebase | Yes — Phase 3's `GITHUB_TOKEN` was already a plain PAT; this is the same shape, just user-scoped and no longer manually pasted | Would need net-new installation-token machinery |

A GitHub App is the better choice for a multi-tenant SaaS product at real scale (fine-grained per-repo permissions, works for org installs without a human's personal token). For this phase, an OAuth App is the smaller, equally-production-valid piece that satisfies "the user doesn't paste a PAT" without adding installation-token refresh logic. Swapping to a GitHub App later only touches `github.oauth.js` and the connect/callback handlers in `github-connection.*` — `github.client.js`'s `{ token, owner, repo }` context shape doesn't change.

## Credential resolution (how a PR actually gets created)

```
Investigation → Project → GitHubRepository → GitHubConnection → token → GitHub API
                                ↓ (if no repository connected)
                     legacy GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO env vars
```

`github.service.js#createIncidentPullRequest` resolves credentials in that order. This means:
- A project with a repository connected via the OAuth flow uses that user's own token and that repository, automatically.
- A project with nothing connected falls back to the Phase 3 global env vars, if set — this is what kept every Phase 3 test passing unmodified.
- If neither is available, `/fix/pr` (and the auto-attempt inside `/fix/approve`) returns a clean `503` naming the actual next step: *"Connect a GitHub repository via POST /api/v1/github/connect."*

The investigation/fix code never touches a GitHub token directly — it only ever calls `createIncidentPullRequest(investigationId, userId)`.

## Security

- **No plaintext tokens.** `encryptedAccessToken` is encrypted with the same AES-256-GCM utility already used for DataSource credentials (`src/utils/encryption.js`, keyed off `DATA_ENCRYPTION_KEY`) — no second encryption scheme was introduced.
- **Never returned.** No controller in this directory ever selects `encryptedAccessToken` into a response; every Prisma query either omits it via `select` or the response mapper drops it before it reaches `sendSuccess`.
- **OAuth CSRF protection.** `GET /github/connect` (JWT-authenticated) generates a random 32-byte `state`, persisted server-side (`GitHubOAuthState`) tied to the requesting user, with a 10-minute expiry. `GET /github/callback` (necessarily unauthenticated — GitHub redirects the browser there directly, with no JWT) validates the state is unexpired and unused *before* exchanging the code, then marks it used. The validated state is what proves which Avenor user this connection belongs to; the code+state pair is not attacker-guessable.
- **Authorization boundary.** Every operation walks JWT user → owns connection → owns project → repository belongs to that connection, enforced at each service function (see `github-connection.service.js`). A user can never select another user's repository into their project, or vice versa, even by guessing a repository's internal UUID.
- **Webhook signature verification.** `POST /github/webhook` is public (GitHub can't send a JWT) but requires a valid `X-Hub-Signature-256` HMAC-SHA256 (keyed by `GITHUB_WEBHOOK_SECRET`), checked with `crypto.timingSafeEqual`. An invalid or missing signature is rejected with `401` before the payload is ever parsed as an event.
- **No auto-merge, no auto-approve.** `FixApprovalStatus.APPROVED` is set only by `POST /investigations/:id/fix/approve`. PR creation never merges. An incident is marked `RESOLVED` only after the webhook confirms the PR was actually merged — not merely opened.

## Local development setup

1. Register an OAuth App: https://github.com/settings/developers → "New OAuth App".
   - Homepage URL: anything (e.g. `http://localhost:3000`).
   - Authorization callback URL: `http://localhost:3000/api/v1/github/callback` (must match `GITHUB_REDIRECT_URI` if you set one, or the request's own host if you don't).
2. Copy the Client ID and generate a Client Secret into `.env`:
   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```
3. (Optional) For webhook testing, add a webhook on a test repo pointing at `https://<your-tunnel>/api/v1/github/webhook`, content type `application/json`, and set the same secret in `.env`:
   ```env
   GITHUB_WEBHOOK_SECRET=...
   ```
4. `GET /api/v1/github/connect` (with a valid Avenor JWT) returns `{ url }` — open it in a browser, authorize, and you'll land on `/github/callback`, which returns the connection as JSON.
5. `GET /api/v1/github/repositories` lists what that account can access; `POST /api/v1/github/repositories/:id/select` with `{ "projectId": "..." }` links one to a project.
6. Run the existing fix flow (`/investigations/:id/run` → `/fix/validate` → `/fix/approve`) — approval now automatically attempts PR creation against that connected repository.

Without any of this configured, Avenor still boots and the full investigation/fix pipeline still works up through `APPROVED` — only PR creation is unavailable, and it fails cleanly rather than crashing.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `GET /github/connect` → 503 | `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` not set |
| `GET /github/callback` → 400 "invalid, expired, or already used" | State older than 10 minutes, already consumed, or the OAuth App's registered callback URL doesn't match `GITHUB_REDIRECT_URI` exactly |
| `GET /github/account` or `/repositories` → 422 | No active `GitHubConnection` for this user yet |
| `GET /github/account` or `/repositories` → 401 | GitHub token was revoked externally (user removed the OAuth App's access) — reconnect |
| `/fix/pr` → 503 "GitHub repository is not connected" | Project has no `GitHubRepository` linked, and no `GITHUB_TOKEN`/`GITHUB_OWNER`/`GITHUB_REPO` fallback is set |
| `POST /github/webhook` → 401 | Signature mismatch — check `GITHUB_WEBHOOK_SECRET` matches the webhook's configured secret exactly |
| Webhook returns 200 with `handled: false` | Event type isn't `pull_request`, or the PR number + repository full name don't match any `DataIncident.githubPr` on record |

## What's intentionally not implemented

- **Refresh tokens.** Classic OAuth App tokens don't expire by default; if GitHub's optional token-expiration setting is enabled on the App, refresh handling would need to be added here — it currently isn't.
- **Multi-connection UX.** The data model supports a user holding connections to multiple GitHub accounts (`GitHubConnection` isn't unique per user), but `/status`, `/account`, and `/repositories` currently operate on the most-recently-connected active one. `DELETE /github/connection` disconnects all of them.
- **Full PR lifecycle.** The webhook recognizes exactly `pull_request` `closed` (merged and not-merged); it doesn't track review state, CI checks, or comments.
