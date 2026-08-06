import * as z from "zod";

export const TaskCreationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Specify the task")
    .max(255, "Task title is too long"),
  dueAt: z.coerce.date("Due date should be of type date"),
  description: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .trim()
      .min(1)
      .max(5000, "Description content is too long")
      .optional()
      .nullable(),
  ),
  assigneeId: z.coerce.number().int().positive("A valid assignee is required."),
});

export const TaskUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Specify the task")
    .max(255, "Task title is too long")
    .optional(),
  description: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .trim()
      .min(1)
      .max(5000, "Description content is too long")
      .optional()
      .nullable(),
  ),
  dueAt: z.coerce.date("Due date should be of type date").optional(),
  assigneeId: z.coerce
    .number()
    .int()
    .positive("A valid assignee is required.")
    .optional(),
  status: z
    .enum(["WIP", "DONE", "OVERDUE"], "Task status not found")
    .optional(),
  listId: z.coerce
    .number()
    .int()
    .positive("listId must be a positive integer")
    .optional(),
  location: z
    .object({
      before: z.coerce
        .number()
        .int()
        .nonnegative("Position before must be a positive integer")
        .nullable(),
      after: z.coerce
        .number()
        .int()
        .nonnegative("Position after must be a positive integer")
        .nullable(),
    })
    .optional(),
});

export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

export type TaskCreationInput = z.infer<typeof TaskCreationSchema>;
