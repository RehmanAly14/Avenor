import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/http.js";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Parses one multipart/form-data file field named `file`, without a third-party dependency. */
export function singleFileUpload(req, _res, next) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!boundaryMatch) return next(new AppError("Content-Type must be multipart/form-data.", HTTP_STATUS.UNPROCESSABLE_ENTITY));
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_FILE_SIZE) {
      tooLarge = true;
      return;
    }
    chunks.push(chunk);
  });
  req.on("error", next);
  req.on("end", () => {
    if (tooLarge) return next(new AppError("File exceeds the 25 MB upload limit.", HTTP_STATUS.UNPROCESSABLE_ENTITY));
    try {
      const parts = []; const body = Buffer.concat(chunks); let cursor = 0;
      while (cursor < body.length) { const start = body.indexOf(boundary, cursor); if (start < 0) break; const nextBoundary = body.indexOf(boundary, start + boundary.length); if (nextBoundary < 0) break; const part = body.subarray(start + boundary.length + 2, nextBoundary - 2); cursor = nextBoundary; const separator = part.indexOf(Buffer.from("\r\n\r\n")); if (separator < 0) continue; parts.push({ headers: part.subarray(0, separator).toString("utf8"), data: part.subarray(separator + 4) }); }
      req.body = {};
      for (const part of parts) { const disposition = part.headers.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i); if (!disposition) continue; const [, name, filename] = disposition; if (filename !== undefined) { req.file = { fieldname: name, originalname: filename, mimetype: (part.headers.match(/content-type:\s*([^\r\n]+)/i)?.[1] || "application/octet-stream").trim(), buffer: part.data, size: part.data.length }; } else req.body[name] = part.data.toString("utf8"); }
      if (!req.file) throw new AppError("A file field is required.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
      next();
    } catch (error) { next(error); }
  });
}
