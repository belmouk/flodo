import * as z from "zod";

export const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(150, "Workspace name is too long"),
});
