import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { AppError } from "./AppError.js";
import { HTTP_STATUS } from "../constants/http.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), "storage", "documents");

function safeFilename(filename) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function storeDocument(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new AppError("A non-empty file is required.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const storedName = `${crypto.randomUUID()}-${safeFilename(filename)}`;
  const storagePath = path.join(UPLOAD_ROOT, storedName);
  await fs.writeFile(storagePath, buffer, { flag: "wx" });
  return storagePath;
}

export async function removeDocument(storagePath) {
  const resolvedPath = path.resolve(storagePath);
  if (!resolvedPath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) throw new AppError("Invalid document storage path.", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  await fs.rm(resolvedPath, { force: true });
}
