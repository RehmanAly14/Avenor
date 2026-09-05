import { z } from "zod";

export const callbackQuerySchema = z.object({
  code: z.string().min(1, "Missing GitHub authorization code."),
  state: z.string().min(1, "Missing OAuth state."),
});

export const repositoryIdParamSchema = z.object({ id: z.string().uuid() });

export const selectRepositorySchema = z.object({
  projectId: z.string().uuid(),
});
