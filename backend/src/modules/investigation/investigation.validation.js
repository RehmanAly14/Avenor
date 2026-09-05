import { z } from "zod";

const uuid = z.string().uuid();
const severity = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const status = z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "FAILED"]);

export const idParamSchema = z.object({ id: uuid });

export const createInvestigationSchema = z.object({
  projectId: uuid,
  workspaceId: uuid,
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  severity: severity.optional(),
});

export const listInvestigationsQuerySchema = z.object({
  projectId: uuid.optional(),
  workspaceId: uuid.optional(),
  status: status.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const analyzeSchema = z.object({
  assetId: uuid,
  problem: z.string().min(1).max(2000),
});

export const rejectFixSchema = z.object({
  reason: z.string().max(2000).optional().nullable(),
});
