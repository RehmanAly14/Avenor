import { z } from "zod";

const provider = z.enum(["POSTGRESQL", "MYSQL"]);
const status = z.enum(["ACTIVE", "INACTIVE", "ERROR"]);
const base = {
  projectId: z.string().uuid(), workspaceId: z.string().uuid(), name: z.string().trim().min(1).max(120), provider,
  host: z.string().trim().min(1).max(255), port: z.coerce.number().int().min(1).max(65535), database: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(255), password: z.string().min(1).max(4096), status: status.optional(),
};
export const createDataSourceSchema = z.object(base);
export const updateDataSourceSchema = z.object({ name: base.name.optional(), host: base.host.optional(), port: base.port.optional(), database: base.database.optional(), username: base.username.optional(), password: base.password.optional(), status: status.optional() }).refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export const listDataSourcesQuerySchema = z.object({ projectId: z.string().uuid().optional(), workspaceId: z.string().uuid().optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const dataSourceIdSchema = z.object({ id: z.string().uuid() });
