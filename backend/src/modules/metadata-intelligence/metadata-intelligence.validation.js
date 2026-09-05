import { z } from "zod";

const uuid = z.string().uuid();
const relationshipType = z.enum(["UPSTREAM", "DOWNSTREAM", "DERIVED_FROM", "READS_FROM", "WRITES_TO"]);

export const assetIdParamSchema = z.object({ assetId: uuid });

export const createLineageSchema = z
  .object({
    sourceAssetId: uuid,
    targetAssetId: uuid,
    relationshipType: relationshipType.default("DOWNSTREAM"),
    confidence: z.coerce.number().min(0).max(1).optional(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .refine((value) => value.sourceAssetId !== value.targetAssetId, {
    message: "An asset cannot have a lineage relationship with itself.",
    path: ["targetAssetId"],
  });

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(255),
  projectId: uuid.optional(),
  workspaceId: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const columnSnapshot = z.object({
  name: z.string().min(1).max(255),
  dataType: z.string().min(1).max(100),
  isNullable: z.boolean().optional().default(true),
});

export const schemaCompareSchema = z
  .object({
    oldSchemaId: uuid.optional(),
    newSchemaId: uuid.optional(),
    oldColumns: z.array(columnSnapshot).max(1000).optional(),
    newColumns: z.array(columnSnapshot).max(1000).optional(),
  })
  .refine((value) => (value.oldSchemaId && value.newSchemaId) || (value.oldColumns && value.newColumns), {
    message: "Provide either { oldSchemaId, newSchemaId } or { oldColumns, newColumns } snapshots.",
  });
