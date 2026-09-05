import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as c from "./github-connection.controller.js";
import { callbackQuerySchema, repositoryIdParamSchema, selectRepositorySchema } from "./github-connection.validation.js";

// Mounted at "/github". /callback and /webhook are intentionally public
// (GitHub redirects the browser / calls the webhook directly — neither
// carries a JWT); everything else requires authentication.
const router = Router();

router.get("/connect", authenticate, c.connect);
router.get("/callback", validate(callbackQuerySchema, "query"), c.callback);
router.get("/status", authenticate, c.status);
router.get("/account", authenticate, c.account);
router.get("/repositories", authenticate, c.listRepositories);
router.post("/repositories/:id/select", authenticate, validate(repositoryIdParamSchema, "params"), validate(selectRepositorySchema), c.selectRepository);
router.delete("/connection", authenticate, c.disconnect);
router.post("/webhook", c.handleWebhook);

export default router;
