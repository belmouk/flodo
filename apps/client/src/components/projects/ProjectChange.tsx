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
import type { Project } from "@repo/db";
import { SquarePen, FilePlusCorner } from "lucide-react";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import type { ApiError } from "@repo/utils";
import { ProjectSchema } from "@repo/types";
import { toast } from "sonner";

type FormErrors = Record<string, string[] | undefined>;

type ProjectChangeProps =
  | {
      HTTPMethod: "PUT";
      projectId: number;
      workspaceId: number;
    }
  | {
      HTTPMethod: "POST";
      projectId?: undefined;
      workspaceId: number;
    };

function ProjectChange({
  HTTPMethod,
  projectId,
  workspaceId,
}: ProjectChangeProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState({ name: "" });
  const isEdit = HTTPMethod === "PUT";
  const mutation = useMutation({
    mutationFn: async ({ name }: typeof input) => {
      const url = isEdit
        ? `/projects/${projectId}`
        : `/workspaces/${workspaceId}/projects`;

      const res = await fetchApi<Project>(url, HTTPMethod, { name });
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
      await queryClient.invalidateQueries({
        queryKey: ["workspace", String(workspaceId)],
      });
      setInput({ name: "" });
      setErrors({});
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = ProjectSchema.safeParse(input);
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
    if (isEdit && nextOpen) {
      const projects = queryClient.getQueryData<Project[]>([
        "workspace",
        String(workspaceId),
      ]);
      const project = projects?.find((pj) => pj.id === projectId);
      if (project) setInput({ name: project.name });
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button className="hover:cursor-pointer" variant={"ghost"}>
              {isEdit ? (
                <SquarePen className="size-6" />
              ) : (
                <FilePlusCorner className="size-6" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{isEdit ? "Edit" : "Add"}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Update your project name and details."
              : "Create a new project by entering a name."}
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

export default ProjectChange;
