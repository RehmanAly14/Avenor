import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catalogQuerySchema,catalogIdSchema } from "./catalog.validation.js";
import * as c from "./catalog.controller.js";
const router=Router();router.use(authenticate);router.get("/assets",validate(catalogQuerySchema,"query"),c.listAssets);router.get("/search",validate(catalogQuerySchema,"query"),c.listAssets);router.get("/:id",validate(catalogIdSchema,"params"),c.getAsset);export default router;
