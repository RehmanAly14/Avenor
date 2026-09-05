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

export const connect = asyncHandler(async (req, res) => {
  const url = await service.initiateConnect(req.user.id, redirectUriFor(req));
  sendSuccess(res, { message: "GitHub authorization URL generated.", data: { url } });
});

// Public: GitHub redirects the user's browser here directly, with no
// JWT. The validated OAuth state is what ties this request back to the
// user who called /connect — see github-connection.service.js.
export const callback = asyncHandler(async (req, res) => {
  const connection = await service.handleCallback({ code: req.query.code, state: req.query.state, redirectUri: redirectUriFor(req) });
  sendSuccess(res, { message: "GitHub account connected successfully.", data: { connection } });
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
