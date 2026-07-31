import * as z from "zod";

export const ProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(150, "Project name is too long"),
});
