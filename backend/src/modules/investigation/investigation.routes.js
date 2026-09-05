import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as c from "./investigation.controller.js";
import { createInvestigationSchema, listInvestigationsQuerySchema, idParamSchema, analyzeSchema, rejectFixSchema } from "./investigation.validation.js";

const router = Router();
router.use(authenticate);

router.route("/").get(validate(listInvestigationsQuerySchema, "query"), c.listInvestigations).post(validate(createInvestigationSchema), c.createInvestigation);
router.get("/:id", validate(idParamSchema, "params"), c.getInvestigation);
router.post("/:id/analyze", validate(idParamSchema, "params"), validate(analyzeSchema), c.analyze);
router.post("/:id/run", validate(idParamSchema, "params"), c.runInvestigation);
router.get("/:id/status", validate(idParamSchema, "params"), c.getInvestigationStatus);
router.get("/:id/report", validate(idParamSchema, "params"), c.getInvestigationReport);
router.get("/:id/timeline", validate(idParamSchema, "params"), c.getTimeline);

router.get("/:id/fix", validate(idParamSchema, "params"), c.getFix);
router.post("/:id/fix/validate", validate(idParamSchema, "params"), c.validateFix);
router.post("/:id/fix/approve", validate(idParamSchema, "params"), c.approveFix);
router.post("/:id/fix/reject", validate(idParamSchema, "params"), validate(rejectFixSchema), c.rejectFix);

export default router;
