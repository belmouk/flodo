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
import type { List } from "../../../../server/generated/prisma/client";
import { SquarePen, CirclePlus } from "lucide-react";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import type ApiError from "../../../../server/src/lib/ApiError";
import type { ProjectWithLists } from "@/pages/Project";

type ListChangeProps =
  | {
      HTTPMethod: "POST";
      workspaceId: number;
      projectId: number;
      listId?: number;
    }
  | {
      HTTPMethod: "PUT";
      workspaceId: number;
      projectId: number;
      listId: number;
    };

const schema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(150, "List name is too long"),
});

type FormErrors = Record<string, string[] | undefined>;

function ListChange({
  HTTPMethod,
  listId,
  workspaceId,
  projectId,
}: ListChangeProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState({ name: "" });
  const mutation = useMutation({
    mutationFn: async ({ name }: typeof input) => {
      const url =
        HTTPMethod === "POST"
          ? `/workspaces/${workspaceId}/projects/${projectId}/lists`
          : `/lists/${listId}`;

      const res = await fetchApi<List>(url, HTTPMethod, { name });
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.status === 500) throw new Response(null, { status: 500 });
      if (error.status === 401) return navigate("/login");
      setErrors(error.details);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lists", projectId] });
      setInput({ name: "" });
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
      setInput({ name: "" });
    }
    if (HTTPMethod === "PUT" && nextOpen) {
      const project = queryClient.getQueryData<ProjectWithLists>([
        "lists",
        projectId,
      ]);
      const list = project?.lists?.find((ls) => ls.id === listId);
      if (list) setInput({ name: list.name });
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
            {HTTPMethod === "PUT" ? "Edit List" : "New List"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {HTTPMethod === "PUT"
              ? "Update your list name and details."
              : "Create a new list by entering a name."}
          </DialogDescription>
        </DialogHeader>
        <form method="POST" onSubmit={handleSubmit}>
          <FieldSet className="mb-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name:</FieldLabel>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  value={input.name}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    handleChange("name", e);
                  }}
                />
                {errors.name?.[0] && <FieldError>{errors.name[0]}</FieldError>}
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

export default ListChange;
