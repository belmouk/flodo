import * as z from "zod";

export const ListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(255, "List name too long"),
});
