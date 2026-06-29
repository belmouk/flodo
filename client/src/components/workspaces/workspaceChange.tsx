import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
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
import type { Workspace } from "../../../../server/generated/prisma/client";
import { SquarePen, FolderPlus } from "lucide-react";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}
interface WorkspaceMutation {
  name: string;
  id?: number;
}

const apiUrl = import.meta.env.VITE_API_URL;

const schema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(150, "Workspace name is too long"),
});

interface ValidationError {
  name?: { message: string }[];
}

interface FormInput {
  name: string;
}

function WorkspaceChange({ HTTPMethod }: { HTTPMethod: "POST" | "PUT" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaceId } = useParams();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState<FormInput>({ name: "" });
  const mutation = useMutation({
    mutationFn: async ({ name, id }: WorkspaceMutation) => {
      const url =
        HTTPMethod === "POST"
          ? `${apiUrl}/workspaces`
          : `${apiUrl}/workspaces/${id}`;

      const res = await fetchApi<Workspace>(url, HTTPMethod, { name });
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.status === 401) return navigate("/login");
      if (error.details) {
        setErrors(error.details);
      }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setInput({ name: "" });
      setErrors({});
      setOpen(false);
      if (data) navigate(`/workspaces/${data.id}`);
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = schema.safeParse(input);
    if (!result.success) {
      const errors = z.flattenError(result.error).fieldErrors;
      if (errors.name) {
        const nameErrors = errors.name.map((err) => ({
          message: err,
        }));
        setErrors({ name: nameErrors });
      }
      return;
    }
    const id =
      HTTPMethod === "PUT" && workspaceId ? Number(workspaceId) : undefined;
    mutation.mutate({ ...result.data, id });
  };

  const handleChange = (
    field: keyof FormInput,
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

    if (HTTPMethod === "PUT" && nextOpen && workspaceId) {
      const workspaces = queryClient.getQueryData<Workspace[]>(["workspaces"]);
      const id = Number(workspaceId);
      const workspace = workspaces?.find((ws) => ws.id === id);
      if (workspace) setInput({ name: workspace.name });
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
                <FolderPlus className="size-6" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{HTTPMethod === "PUT" ? "Edit" : "Add"}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {HTTPMethod === "PUT" ? "Edit Workspace" : "New Workspace"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {HTTPMethod === "PUT"
              ? "Update your workspace name and details."
              : "Create a new workspace by entering a name."}
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
                  onChange={(e) => handleChange("name", e)}
                />
                <FieldError errors={errors.name} />
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

export default WorkspaceChange;
