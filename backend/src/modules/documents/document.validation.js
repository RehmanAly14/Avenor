import { z } from "zod";
export const uploadDocumentSchema = z.object({ projectId: z.string().uuid(), workspaceId: z.string().uuid() });
export const documentQuerySchema = z.object({ projectId: z.string().uuid().optional(), workspaceId: z.string().uuid().optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const documentIdSchema = z.object({ id: z.string().uuid() });
