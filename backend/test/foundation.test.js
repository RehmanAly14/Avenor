import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { Readable } from "node:stream";

import app from "../src/app.js";
import { decrypt, encrypt } from "../src/utils/encryption.js";
import { storeDocument, removeDocument } from "../src/utils/storage.js";
import { createDataSourceSchema } from "../src/modules/datasources/datasource.validation.js";
import { catalogQuerySchema } from "../src/modules/catalog/catalog.validation.js";
import { singleFileUpload } from "../src/middlewares/upload.middleware.js";

async function request(path, options) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("unknown routes return the standard 404 error envelope", async () => {
  const response = await request("/api/v1/not-registered");
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(typeof body.message, "string");
});

test("malformed JSON returns a 400 error envelope", async () => {
  const response = await request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.deepEqual(body, { success: false, message: "Malformed JSON request body." });
});

test("datasource and catalog validation reject invalid inputs and coerce pagination", () => {
  assert.equal(createDataSourceSchema.safeParse({}).success, false);
  const query = catalogQuerySchema.parse({ page: "2", limit: "10", sortBy: "name" });
  assert.equal(query.page, 2);
  assert.equal(query.limit, 10);
});

test("encryption and local storage round-trip safely", async () => {
  const encrypted = encrypt("credential");
  assert.notEqual(encrypted, "credential");
  assert.equal(decrypt(encrypted), "credential");
  const path = await storeDocument(Buffer.from("Avenor"), "foundation-test.txt");
  await removeDocument(path);
});

test("multipart parser extracts metadata and a document file", async () => {
  const boundary = "AvenorBoundary";
  const payload = [
    `--${boundary}\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n11111111-1111-4111-8111-111111111111\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="workspaceId"\r\n\r\n22222222-2222-4222-8222-222222222222\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="note.txt"\r\nContent-Type: text/plain\r\n\r\nhello\r\n`,
    `--${boundary}--\r\n`,
  ].join("");
  const req = Readable.from([Buffer.from(payload)]);
  req.headers = { "content-type": `multipart/form-data; boundary=${boundary}` };
  await new Promise((resolve, reject) => singleFileUpload(req, {}, (error) => error ? reject(error) : resolve()));
  assert.equal(req.body.projectId, "11111111-1111-4111-8111-111111111111");
  assert.equal(req.file.originalname, "note.txt");
  assert.equal(req.file.buffer.toString(), "hello");
});
