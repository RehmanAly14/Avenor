import * as service from "./metadata-intelligence.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, buildPaginationMeta } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";

export const createLineage = asyncHandler(async (req, res) =>
  sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, message: "Lineage relationship created successfully.", data: { lineage: await service.createLineage(req.user.id, req.body) } })
);

export const getLineage = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Lineage retrieved successfully.", data: await service.getLineage(req.params.assetId, req.user.id) })
);

export const getUpstream = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Upstream lineage retrieved successfully.", data: await service.getUpstream(req.params.assetId, req.user.id) })
);

export const getDownstream = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Downstream lineage retrieved successfully.", data: await service.getDownstream(req.params.assetId, req.user.id) })
);

export const getGraph = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Lineage graph retrieved successfully.", data: await service.getGraph(req.params.assetId, req.user.id) })
);

export const getImpact = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Impact analysis completed successfully.", data: await service.getImpact(req.params.assetId, req.user.id) })
);

export const search = asyncHandler(async (req, res) => {
  const result = await service.search(req.user.id, req.query);
  sendSuccess(res, { message: "Metadata search completed successfully.", data: { results: result.items }, meta: buildPaginationMeta({ total: result.total, page: result.pagination.page, limit: result.pagination.limit }) });
});

export const compareSchema = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: "Schema comparison completed successfully.", data: await service.compareSchema(req.user.id, req.body) })
);
