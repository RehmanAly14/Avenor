import * as service from "./github.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

export const createPullRequest = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Pull request created successfully.", data: await service.createIncidentPullRequest(req.params.id, req.user.id) })
);
