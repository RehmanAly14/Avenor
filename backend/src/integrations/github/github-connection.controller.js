import * as service from "./github-connection.service.js";
import * as webhook from "./github.webhook.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

function redirectUriFor(req) {
  return env.GITHUB_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/${env.API_VERSION}/github/callback`;
}

// The OAuth callback is opened as its own browser tab/window (GitHub
// redirects here directly, not the SPA), so it renders a small standalone
// HTML page rather than a JSON envelope — there's no frontend router to
// hand the response to. It auto-closes back into the tab that started the
// connection (GitHubPage.tsx already re-checks connection status on
// visibilitychange), falling back to a link for browsers that block
// window.close() on tabs the user navigated within manually.
function renderCallbackPage({ success, heading, detail }) {
  const frontendUrl = env.CORS_ORIGINS[0] || "http://localhost:5173";
  const accent = success ? "#16a34a" : "#dc2626";
  const icon = success
    ? '<path d="M20 6 9 17l-5-5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    : '<path d="M18 6 6 18M6 6l12 12" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${success ? "GitHub connected" : "GitHub connection failed"} · Avenor</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0b0d12; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #e6e8eb; }
  .card { max-width: 380px; padding: 32px; border-radius: 12px; border: 1px solid #23262e; background: #14161c; text-align: center; }
  .icon { width: 48px; height: 48px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${success ? "#16a34a1a" : "#dc26261a"}; margin: 0 auto 16px; }
  h1 { font-size: 17px; margin: 0 0 8px; color: ${accent}; }
  p { font-size: 13px; line-height: 1.5; color: #9a9ea6; margin: 0 0 20px; }
  a.button { display: inline-block; font-size: 13px; font-weight: 600; color: #0b0d12; background: #e6e8eb; padding: 9px 16px; border-radius: 8px; text-decoration: none; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon"><svg width="24" height="24" viewBox="0 0 24 24">${icon}</svg></div>
    <h1>${heading}</h1>
    <p>${detail}</p>
    <a class="button" href="${frontendUrl}/github">Return to Avenor</a>
  </div>
  <script>
    // The tab that started the connection re-checks status on
    // visibilitychange (see GitHubPage.tsx), so just try to close this
    // one back into it. window.open() was called with "noopener", so
    // window.opener is unavailable here — but close() still works on an
    // auxiliary browsing context a script opened; browsers that block it
    // (e.g. this URL was opened directly, not via the popup) just leave
    // the tab open, and the link above still gets the user back.
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`;
}

export const connect = asyncHandler(async (req, res) => {
  const url = await service.initiateConnect(req.user.id, redirectUriFor(req));
  sendSuccess(res, { message: "GitHub authorization URL generated.", data: { url } });
});

// Public: GitHub redirects the user's browser here directly, with no
// JWT. The validated OAuth state is what ties this request back to the
// user who called /connect — see github-connection.service.js. The
// response is an HTML page, not the JSON envelope every other route
// uses: the browser lands on this URL directly, with no SPA route to
// hand a JSON body to.
export const callback = asyncHandler(async (req, res) => {
  try {
    const connection = await service.handleCallback({ code: req.query.code, state: req.query.state, redirectUri: redirectUriFor(req) });
    res.status(HTTP_STATUS.OK).send(
      renderCallbackPage({
        success: true,
        heading: "GitHub connected",
        detail: `Connected as ${connection.githubLogin}. This tab will close automatically.`,
      })
    );
  } catch (err) {
    const statusCode = err instanceof AppError ? err.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err instanceof AppError ? err.message : "Something went wrong connecting your GitHub account.";
    res.status(statusCode).send(renderCallbackPage({ success: false, heading: "Connection failed", detail: message }));
  }
});

export const status = asyncHandler(async (req, res) => sendSuccess(res, { message: "GitHub connection status retrieved successfully.", data: await service.getConnectionStatus(req.user.id) }));

export const account = asyncHandler(async (req, res) => sendSuccess(res, { message: "GitHub account retrieved successfully.", data: await service.getAccount(req.user.id) }));

export const listRepositories = asyncHandler(async (req, res) => sendSuccess(res, { message: "GitHub repositories retrieved successfully.", data: { repositories: await service.listRepositories(req.user.id) } }));

export const selectRepository = asyncHandler(async (req, res) => sendSuccess(res, { message: "Repository connected to project successfully.", data: { project: await service.selectRepository(req.user.id, req.params.id, req.body.projectId) } }));

export const disconnect = asyncHandler(async (req, res) => {
  await service.disconnect(req.user.id);
  sendSuccess(res, { message: "GitHub disconnected successfully." });
});

// Public: GitHub calls this directly. Authentication here is the HMAC
// signature (X-Hub-Signature-256), not a JWT — see github.webhook.js.
export const handleWebhook = asyncHandler(async (req, res) => {
  if (!webhook.verifySignature(req.rawBody, req.headers["x-hub-signature-256"])) {
    throw new AppError("Invalid webhook signature.", HTTP_STATUS.UNAUTHORIZED);
  }

  const event = req.headers["x-github-event"];
  const result = event === "pull_request" ? await webhook.handlePullRequestEvent(req.body) : { handled: false };

  sendSuccess(res, { message: "Webhook processed.", data: result });
});
