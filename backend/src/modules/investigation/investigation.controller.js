import * as service from "./investigation.service.js";
import * as fixService from "./fix.service.js";
import { listEvents } from "./incident-event.service.js";
import * as orchestrator from "../../ai/orchestrator/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, buildPaginationMeta } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";

export const createInvestigation = asyncHandler(async (req, res) =>
  sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, message: "Investigation opened successfully.", data: { investigation: await service.createInvestigation(req.user.id, req.body) } })
);

export const listInvestigations = asyncHandler(async (req, res) => {
  const result = await service.listInvestigations(req.user.id, req.query);
  sendSuccess(res, { message: "Investigations retrieved successfully.", data: { investigations: result.items }, meta: buildPaginationMeta({ total: result.total, page: result.pagination.page, limit: result.pagination.limit }) });
});

export const getInvestigation = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Investigation retrieved successfully.", data: { investigation: await service.getInvestigation(req.params.id, req.user.id) } })
);

export const analyze = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Investigation analysis completed successfully.", data: await service.analyze(req.params.id, req.user.id, req.body) })
);

export const runInvestigation = asyncHandler(async (req, res) => {
  const result = await orchestrator.runPipeline({ investigationId: req.params.id, userId: req.user.id });
  const message = result.stage === "COMPLETED" ? "Investigation completed successfully." : result.stage === "FAILED" ? "Investigation failed." : "Investigation started.";
  sendSuccess(res, { message, data: { investigationId: result.id, status: result.stage, error: result.error } });
});

export const getInvestigationStatus = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Investigation status retrieved successfully.", data: await orchestrator.getStatus(req.params.id, req.user.id) })
);

export const getInvestigationReport = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Investigation report retrieved successfully.", data: await orchestrator.getReport(req.params.id, req.user.id) })
);

export const getTimeline = asyncHandler(async (req, res) => {
  await service.getInvestigation(req.params.id, req.user.id); // ownership/scope check
  sendSuccess(res, { message: "Investigation timeline retrieved successfully.", data: { timeline: await listEvents(req.params.id) } });
});

export const getFix = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Fix retrieved successfully.", data: await fixService.getFix(req.params.id, req.user.id) })
);

export const validateFix = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Fix validation completed successfully.", data: await fixService.validateFix(req.params.id, req.user.id) })
);

export const approveFix = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Fix approved successfully.", data: await fixService.approveFix(req.params.id, req.user.id) })
);

export const rejectFix = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Fix rejected successfully.", data: await fixService.rejectFix(req.params.id, req.user.id, req.body.reason) })
);
