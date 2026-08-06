import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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
import type { ProjectWithListsAndMembers } from "@/pages/Project";
import { TaskUpdateSchema } from "@repo/types";
import type { TaskUpdateInput } from "@repo/types";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

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
  const cleanInput = {
    title: undefined,
    description: undefined,
    dueAt: undefined,
    assigneeId: undefined,
  } as const;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState<FormInput>(cleanInput);
  const isEdit = HTTPMethod === "PATCH";
  const mutation = useMutation({
    mutationFn: async (body: TaskUpdateInput) => {
      const url = isEdit
        ? `/tasks/${taskId}`
        : `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`;

      const res = await fetchApi<List>(url, HTTPMethod, body);
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.status === 401) {
        return navigate("/login");
      } else if (error.status === 400) {
        setErrors(error.details);
      } else {
        toast.error(error.message);
      }
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
    e: React.ChangeEvent<HTMLInputElement> | number,
  ) => {
    if (typeof e === "number") {
      setInput((prev) => ({ ...prev, [field]: e }));
    } else {
      setInput((prev) => ({ ...prev, [field]: e.target.value }));
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
      setInput(cleanInput);
    }
    if (isEdit && nextOpen) {
      const project = queryClient.getQueryData<ProjectWithListsAndMembers>([
        "lists",
        String(projectId),
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
  const projectMembers =
    queryClient.getQueryData<ProjectWithListsAndMembers>([
      "lists",
      String(projectId),
    ])?.members || [];
  const items = projectMembers.map((member) => ({
    label: `${member.user.lastName} ${member.user.firstName}`,
    value: member.userId,
  }));

  const defaultItem = items.find((item) => item.value === input.assigneeId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button className="hover:cursor-pointer" variant={"ghost"}>
              {isEdit ? (
                <SquarePen className="size-6" />
              ) : (
                <CirclePlus className="size-6" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{isEdit ? "Edit" : "Add"}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
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
                <FieldLabel htmlFor="dueAt">Due By:</FieldLabel>
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
              <Field className="">
                <FieldLabel htmlFor="assigneeId">Assign To:</FieldLabel>
                <Combobox
                  items={items}
                  itemToStringValue={(member: (typeof items)[number]) =>
                    member.label
                  }
                  onValueChange={(item) => {
                    if (item) handleChange("assigneeId", item.value);
                    console.log(input);
                  }}
                  defaultValue={defaultItem}
                >
                  <ComboboxInput placeholder="Select an assignee" />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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
