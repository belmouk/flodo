import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import type React from "react";
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
import { Input } from "./ui/input";
import { useState } from "react";
import * as z from "zod";
import type { Workspace } from "../../../server/generated/prisma/client";
import { Trash2, SquarePen, FolderPlus } from "lucide-react";

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
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

function ControlPanel({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="flex gap-0" {...props}>
      {children}
    </div>
  );
}

function ControlPanelDelete({ ...props }: React.ComponentProps<"button">) {
  let navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaceId } = useParams();
  const deleteWorkspace = useMutation({
    mutationFn: async (workspaceId: number) => {
      const result = await fetchApi<undefined>(
        `${apiUrl}/workspaces/${workspaceId}`,
        "DELETE",
      );
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      navigate("/workspaces");
    },
    onError(error: ApiError) {
      if (error.status === 401) return navigate("/login");
    },
  });

  const handleClick = () => {
    if (workspaceId) {
      const id = parseInt(workspaceId, 10);
      deleteWorkspace.mutate(id);
    }
  };

  return (
    <Button
      className="hover:cursor-pointer"
      disabled={deleteWorkspace.isPending}
      onClick={handleClick}
      {...props}
      variant={"ghost"}
      title="Delete"
    >
      <Trash2 color="red" className="size-6" />
    </Button>
  );
}

function ControlPanelUpdate() {
  let navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaceId } = useParams();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState<FormInput>({ name: "" });
  const editWorkspace = useMutation({
    mutationFn: async (workspace: { name: string; id: number }) => {
      if (editWorkspace.isPending) return;
      const result = schema.safeParse(workspace);
      if (!result.success) {
        const formErrors = z.flattenError(result.error).fieldErrors;
        if (formErrors.name) {
          const nameErrors = formErrors.name.map((err) => ({
            message: err,
          }));
          setErrors({ name: nameErrors });
          throw { code: "Validation" };
        }
      }
      const res = await fetchApi<Workspace>(
        `${apiUrl}/workspaces/${workspace.id}`,
        "PUT",
        result.data,
      );
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.code === "Validation") return;
      if (error.status === 401) return navigate("/login");
      if (error.details) {
        setErrors(error.details);
      }
    },
    onSuccess: async (data) => {
      setInput({ name: "" });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (data) navigate(`/workspaces/${data.id}`);
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (workspaceId) {
      const id = parseInt(workspaceId, 10);
      editWorkspace.mutate({ name: input.name, id });
    }
  };
  const handleChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newInput = { ...input, [field]: e.target.value };
    setInput(newInput);
    setErrors({ ...errors, [field]: undefined });
  };
  const handleOpenChange = () => {
    console.log("opening handler");
    if (!open) {
      const data: Workspace[] | undefined = queryClient.getQueryData([
        "workspaces",
      ]);
      console.log(data);
      if (data) {
        if (workspaceId) {
          const id = parseInt(workspaceId, 10);
          const workspace = data.find((ws: Workspace) => ws.id === id);
          console.log(workspace);
          workspace ? setInput({ name: workspace.name }) : setOpen(false);
          console.log(input);
          return setOpen(true);
        }
      }
    }
    return setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="hover:cursor-pointer" variant={"ghost"} title="Edit">
          <SquarePen className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
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
                ></Input>
                <FieldError errors={errors.name} />
              </Field>
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <Button type="submit">Confirm</Button>
            <DialogClose asChild>
              <Button
                className="hover:cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ControlPanelCreate() {
  let navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState<FormInput>({ name: "" });
  const createWorkspace = useMutation({
    mutationFn: async (workspace: { name: string }) => {
      const result = schema.safeParse(workspace);
      if (!result.success) {
        const formErrors = z.flattenError(result.error).fieldErrors;
        if (formErrors.name) {
          const nameErrors = formErrors.name.map((err) => ({
            message: err,
          }));
          setErrors({ name: nameErrors });
          throw { code: "Validation" };
        }
      }
      const res = await fetchApi<Workspace>(
        `${apiUrl}/workspaces`,
        "POST",
        result.data,
      );
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onError(error: ApiError) {
      if (error.code === "Validation") return;
      if (error.status === 401) return navigate("/login");
      if (error.details) {
        setErrors(error.details);
      }
    },
    onSuccess: async (data) => {
      setInput({ name: "" });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (data) navigate(`/workspaces/${data.id}`);
      setOpen(false);
    },
  });

  const handleChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newInput = { ...input, [field]: e.target.value };
    setInput(newInput);
    setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    createWorkspace.mutate(input);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="mr-0 hover:cursor-pointer"
          variant={"ghost"}
          title="New"
        >
          <FolderPlus className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
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
                ></Input>
                <FieldError errors={errors.name} />
              </Field>
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <Button type="submit">Confirm</Button>
            <DialogClose asChild>
              <Button
                className="hover:cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export {
  ControlPanel,
  ControlPanelDelete,
  ControlPanelUpdate,
  ControlPanelCreate,
};
