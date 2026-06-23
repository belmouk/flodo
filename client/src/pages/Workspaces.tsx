import type { LoaderData } from "@/routes";
import { Outlet, useOutletContext, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import z from "zod";
import { useState } from "react";
import { fetchApi } from "@/lib/utils";
import type { Workspace } from "../../../server/generated/prisma/client";

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

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

interface FormInput {
  name: string;
}

function Workspaces() {
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState<FormInput>({ name: "" });
  const user = useOutletContext<LoaderData>();
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetchApi<Workspace[]>(`${apiUrl}/workspaces`, "GET");
      if (!res.success) throw res.error;
      return res.data;
    },
  });
  const mutation = useMutation({
    mutationFn: async (workspace: { name: string }) => {
      if (mutation.isPending) return;
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
    mutation.mutate(input);
  };

  return (
    <div className="px-4 w-full max-w-2xl">
      <section>
        <h2 className="font-bold text-2xl">Workspaces</h2>
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mr-0 hover:cursor-pointer">
                Add Workspace
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
                      {errors.name ? <FieldError errors={errors.name} /> : null}
                    </Field>
                  </FieldGroup>
                  {mutation.isSuccess ? (
                    <p className="text-green-500">
                      The new workspace has been created successfully.
                    </p>
                  ) : null}
                </FieldSet>
                <DialogFooter>
                  <Button type="submit">Confirm</Button>
                  <DialogClose asChild>
                    <Button className="hover:cursor-pointer" type="button">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isPending ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>{error.message}</p>
        ) : (
          <ul>
            {data.map((workspace) => {
              return (
                <li key={workspace.id}>
                  <Link to={`/workspaces/${workspace.id}`}>
                    {workspace.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-bold text-2xl mt-8">Projects</h2>
        <Outlet />
      </section>
    </div>
  );
}

export default Workspaces;
