import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { singleFileUpload } from "../../middlewares/upload.middleware.js";
import { uploadDocumentSchema,documentQuerySchema,documentIdSchema } from "./document.validation.js";
import * as c from "./document.controller.js";
const router=Router();router.use(authenticate);router.post("/upload",singleFileUpload,validate(uploadDocumentSchema),c.uploadDocument);router.get("/",validate(documentQuerySchema,"query"),c.listDocuments);router.get("/:id",validate(documentIdSchema,"params"),c.getDocument);router.delete("/:id",validate(documentIdSchema,"params"),c.deleteDocument);export default router;
