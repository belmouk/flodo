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
import type { List } from "@repo/db";
import { SquarePen, CirclePlus } from "lucide-react";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import type { ApiError } from "@repo/utils";
import type { ProjectWithLists } from "@/pages/Project";
import type { User } from "@repo/db";
import { TaskUpdateSchema } from "@repo/types";
import type { TaskUpdateInput } from "@repo/types";

type TaskChangeProps =
  | {
      HTTPMethod: "POST";
      workspaceId: number;
      projectId: number;
      listId: number;
      taskId?: number;
    }
  | {
      HTTPMethod: "PATCH";
      workspaceId: number;
      projectId: number;
      listId: number;
      taskId: number;
    };

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
  const user = useOutletContext<Omit<User, "password">>();
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
    mutationFn: async (body: TaskUpdateInput) => {
      const url =
        HTTPMethod === "POST"
          ? `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`
          : `/tasks/${taskId}`;

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
    const result = TaskUpdateSchema.safeParse(input);
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
    if (HTTPMethod === "PATCH" && nextOpen) {
      const project = queryClient.getQueryData<ProjectWithLists>([
        "lists",
        projectId,
      ]);
      if (project) {
        for (const list of project.lists) {
          if (list.id === listId) {
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
              {HTTPMethod === "PATCH" ? (
                <SquarePen className="size-6" />
              ) : (
                <CirclePlus className="size-6" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {HTTPMethod === "PATCH" ? "Edit" : "Add"}
        </TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {HTTPMethod === "PATCH" ? "Edit Task" : "New List"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {HTTPMethod === "PATCH"
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
