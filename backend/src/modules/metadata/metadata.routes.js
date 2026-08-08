import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as c from "./metadata.controller.js";
import { createAssetSchema, updateAssetSchema, assetQuerySchema, createEntitySchema, updateEntitySchema, idParamSchema } from "./metadata.validation.js";
const router=Router(); router.use(authenticate);
router.route("/assets").get(validate(assetQuerySchema,"query"),c.listAssets).post(validate(createAssetSchema),c.createAsset);
router.route("/assets/:id").get(validate(idParamSchema,"params"),c.getAsset).patch(validate(idParamSchema,"params"),validate(updateAssetSchema),c.updateAsset).delete(validate(idParamSchema,"params"),c.deleteAsset);
for (const kind of ["owners","tags","domains"]) { router.route(`/${kind}`).get(c.listEntities(kind)).post(validate(createEntitySchema),c.createEntity(kind)); router.route(`/${kind}/:id`).patch(validate(idParamSchema,"params"),validate(updateEntitySchema),c.updateEntity(kind)).delete(validate(idParamSchema,"params"),c.deleteEntity(kind)); }
export default router;
