import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { Project } from "../../../server/generated/prisma/client";
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
  FieldError,
  FieldLabel,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import z from "zod";
import { useState } from "react";

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

interface ValidationError {
  name?: { message: string }[];
}

interface FormInput {
  name: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const schema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(150, "Project name is too long"),
});

function Workspace() {
  const { workspaceId } = useParams();
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState<FormInput>({ name: "" });
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await fetchApi<Project[]>(
        `${apiUrl}/workspaces/${workspaceId}/projects`,
        "GET",
      );
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!workspaceId,
  });
  const mutation = useMutation({
    mutationFn: async (project: { name: string }) => {
      if (mutation.isPending) return;
      const result = schema.safeParse(project);
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
      const res = await fetchApi(
        `${apiUrl}/workspaces/${workspaceId}/projects`,
        "POST",
        result.data,
      );
      if (!res.success) throw res.error;
    },
    onError(error: ApiError) {
      console.log(error);
      if (error.status === 500) throw new Response(null, { status: 500 });
      if (error.code === "Validation") return;
      // if(error.status === 401)
      if (error.details) {
        setErrors(error.details);
      }
    },
    onSuccess() {
      setInput({ name: "" });
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    mutation.mutate(input);
  };

  const handleChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newInput = { ...input, [field]: e.target.value };
    setInput(newInput);
    setErrors({ ...errors, [field]: undefined });
  };

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;
  return (
    <>
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>+</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form method="POST" onSubmit={handleSubmit}>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Name: </FieldLabel>
                    <Input
                      type="text"
                      id="name"
                      name="name"
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
                  <Button type="button">Close</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {data.length === 0 ? (
        <p>This workspace has no projects. Create one to proceed.</p>
      ) : (
        <ul>
          {data.map((project) => {
            return (
              <li key={project.id}>
                <Link to={`/workspaces/${workspaceId}/projects/${project.id}`}>
                  {project.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default Workspace;
