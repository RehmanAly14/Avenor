import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as c from "./metadata-intelligence.controller.js";
import { createLineageSchema, assetIdParamSchema, searchQuerySchema, schemaCompareSchema } from "./metadata-intelligence.validation.js";

const router = Router();
router.use(authenticate);

router.post("/lineage", validate(createLineageSchema), c.createLineage);
router.get("/lineage/:assetId", validate(assetIdParamSchema, "params"), c.getLineage);
router.get("/lineage/:assetId/upstream", validate(assetIdParamSchema, "params"), c.getUpstream);
router.get("/lineage/:assetId/downstream", validate(assetIdParamSchema, "params"), c.getDownstream);
router.get("/lineage/:assetId/graph", validate(assetIdParamSchema, "params"), c.getGraph);

router.get("/impact/:assetId", validate(assetIdParamSchema, "params"), c.getImpact);

router.get("/intelligence/search", validate(searchQuerySchema, "query"), c.search);

router.post("/schema/compare", validate(schemaCompareSchema), c.compareSchema);

export default router;
