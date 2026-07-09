import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useOutletContext } from "react-router";
import { Button } from "../ui/button";
import type React from "react";
import { fetchApi } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Field,
  FieldSet,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "../ui/input";
import { useState } from "react";
import * as z from "zod";
import type { List } from "../../../../server/generated/prisma/client";
import { SquarePen, CirclePlus } from "lucide-react";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import type ApiError from "../../../../server/src/lib/ApiError";
import type { ProjectWithLists } from "@/pages/Project";
import type { LoaderData } from "@/routes";

type TaskChangeProps =
  | {
      HTTPMethod: "POST";
      workspaceId: number;
      projectId: number;
      listId: number;
      taskId?: number;
    }
  | {
      HTTPMethod: "PUT";
      workspaceId: number;
      projectId: number;
      listId: number;
      taskId: number;
    };

const apiUrl = import.meta.env.VITE_API_URL;

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Specify the task")
    .max(255, "Task title is too long")
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Description content is too long")
    .optional(),
  dueAt: z.coerce.date("Due date should be of type date").optional(),
  assigneeId: z.coerce
    .number()
    .int()
    .positive("AssigneeId must be a positive integer")
    .optional(),
  status: z
    .literal(["WIP", "DONE", "OVERDUE"], "Task status not found")
    .optional(),
  listId: z.coerce
    .number()
    .int()
    .positive("listId must be a positive integer")
    .optional(),
});

type Body = z.infer<typeof schema>;

type FormErrors = Record<string, string[] | undefined>;

type FormInput = {
  title?: string;
  description?: string;
  dueAt?: string;
  assigneeId?: number;
};

function TaskChange({
  HTTPMethod,
  listId,
  workspaceId,
  projectId,
  taskId,
}: TaskChangeProps) {
  const user = useOutletContext<LoaderData>();
  const cleanInput = {
    title: "",
    description: "",
    dueAt: "",
    assigneeId: user.id,
  } as const;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState<FormInput>(cleanInput);
  const mutation = useMutation({
    mutationFn: async (body: Body) => {
      const url =
        HTTPMethod === "POST"
          ? `${apiUrl}/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`
          : `${apiUrl}/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks/${taskId}`;

      const res = await fetchApi<List>(url, HTTPMethod, body);
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.status === 500) throw new Response(null, { status: 500 });
      if (error.status === 401) return navigate("/login");
      setErrors(error.details);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lists"] });
      setInput(cleanInput);
      setErrors({});
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = schema.safeParse(input);
    if (!result.success) {
      const errors = z.flattenError(result.error).fieldErrors;
      setErrors(errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const handleChange = (
    field: keyof typeof input,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInput((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
      setInput(cleanInput);
    }
    if (HTTPMethod === "PUT" && nextOpen) {
      const project = queryClient.getQueryData<ProjectWithLists>(["lists"]);
      if (project && project.lists) {
        for (const list of project.lists) {
          if (list.id === listId && list.tasks) {
            for (const task of list.tasks) {
              if (task.id === taskId)
                setInput({
                  title: task.title,
                  description: task.description || undefined,
                  dueAt: new Date(task.dueAt).toISOString().split("T")[0],
                  assigneeId: task.assigneeId,
                });
            }
          }
        }
      }
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button className="hover:cursor-pointer" variant={"ghost"}>
              {HTTPMethod === "PUT" ? (
                <SquarePen className="size-6" />
              ) : (
                <CirclePlus className="size-6" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{HTTPMethod === "PUT" ? "Edit" : "Add"}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {HTTPMethod === "PUT" ? "Edit Task" : "New List"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {HTTPMethod === "PUT"
              ? "Update your task name and details."
              : "Create a new task by entering a name."}
          </DialogDescription>
        </DialogHeader>
        <form method="POST" onSubmit={handleSubmit}>
          <FieldSet className="mb-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Title:</FieldLabel>
                <Input
                  type="text"
                  name="title"
                  id="title"
                  value={input.title}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    handleChange("title", e);
                  }}
                />
                {errors.title?.[0] && (
                  <FieldError>{errors.title[0]}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description:</FieldLabel>
                <Input
                  type="text"
                  name="description"
                  id="description"
                  value={input.description}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    handleChange("description", e);
                  }}
                />
                {errors.description?.[0] && (
                  <FieldError>{errors.description[0]}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="dueAt">Due At:</FieldLabel>
                <Input
                  type="date"
                  name="dueAt"
                  id="dueAt"
                  value={input.dueAt}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    handleChange("dueAt", e);
                  }}
                />
                {errors.dueAt?.[0] && (
                  <FieldError>{errors.dueAt[0]}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Confirm"}
            </Button>
            <DialogClose asChild>
              <Button className="hover:cursor-pointer" type="button">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskChange;
