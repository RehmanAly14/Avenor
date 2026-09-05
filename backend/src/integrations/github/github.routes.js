import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { idParamSchema } from "../../modules/investigation/investigation.validation.js";
import * as c from "./github.controller.js";

// Mounted at "/investigations" alongside investigation.routes.js — this is
// the on-demand/retry path for PR creation; POST .../fix/approve also
// triggers it automatically once a fix is approved.
const router = Router();
router.use(authenticate);

router.post("/:id/fix/pr", validate(idParamSchema, "params"), c.createPullRequest);

export default router;
