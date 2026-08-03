import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
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
import { Input } from "./ui/input";
import { useState } from "react";
import * as z from "zod";
import { TooltipTrigger, TooltipContent, Tooltip } from "./ui/tooltip";
import type { ApiError } from "@repo/utils";

type HTTPRequestType =
  | { method: "POST"; url: string }
  | { method: "PUT" | "PATCH"; url: string; itemId: number; parentId?: number };

type ResourceChangeProps = {
  HTTPRequest: HTTPRequestType;
  schema: z.ZodType;
  cleanInput: Record<string, unknown>;
  queryKeysToInvalidate: Array<string | number>;
  fields: Array<{ label: string; type: string }>;
  UpdateIcon: React.ReactNode;
  CreateIcon: React.ReactNode;
  resource: "workspace" | "project" | "list" | "task";
};

type FormErrors = Record<string, string[] | undefined>;

function ResourceChange({
  HTTPRequest,
  cleanInput,
  schema,
  queryKeysToInvalidate,
  fields,
  UpdateIcon,
  CreateIcon,
  resource,
}: ResourceChangeProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState(cleanInput);
  const mutation = useMutation({
    mutationFn: async (payload: typeof input) => {
      const res = await fetchApi(HTTPRequest.url, HTTPRequest.method, payload);
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      //replace the throw Response with a toast state
      if (error.status === 500) throw new Response(null, { status: 500 });
      if (error.status === 401) return navigate("/login");
      setErrors(error.details);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeysToInvalidate });
      setInput(cleanInput);
      setErrors({});
      setOpen(false);
      if (resource === "workspace") {
        await navigate(`/workspaces/${data.id}`);
      }
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
    if (
      nextOpen &&
      (HTTPRequest.method === "PUT" || HTTPRequest.method === "PATCH")
    ) {
      const cache = queryClient.getQueryData<Record<string, unknown>[]>(
        queryKeysToInvalidate,
      );
      let cachedResource;
      if (resource === "list") {
        cachedResource = cache?.lists.find(
          (list) => list.id === HTTPRequest.itemId,
        );
      } else if (resource === "task") {
        cachedResource = cache?.lists
          .find((list) => list.id === HTTPRequest.parentId)
          .tasks.find((task) => task.id === HTTPRequest.itemId);
      } else {
        cachedResource = cache?.find((item) => item.id === HTTPRequest.itemId);
      }
      console.log(cache);

      if (cachedResource) {
        setInput(() => {
          const newInput = { ...cleanInput };
          for (const key of Object.keys(newInput)) {
            if (key === "dueAt") {
              newInput[key] = new Date(cachedResource[key])
                .toISOString()
                .split("T")[0];
            } else {
              newInput[key] = cachedResource[key];
            }
          }
          return newInput;
        });
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
              {HTTPRequest.method === "PUT" || HTTPRequest.method === "PATCH"
                ? UpdateIcon
                : CreateIcon}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {HTTPRequest.method === "PUT" ? "Edit" : "Add"}
        </TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {HTTPRequest.method === "PUT"
              ? `Edit ${resource}`
              : "New ${resource}"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {HTTPRequest.method === "PUT"
              ? `Update your ${resource}`
              : `Create a new ${resource}`}
          </DialogDescription>
        </DialogHeader>
        <form method="POST" onSubmit={handleSubmit}>
          <FieldSet className="mb-4">
            <FieldGroup>
              {fields.map((field) => {
                return (
                  <Field>
                    <FieldLabel htmlFor="name">{field.label}</FieldLabel>
                    <Input
                      type={field.type}
                      name={field.label}
                      id={field.label}
                      value={input[field.label]}
                      disabled={mutation.isPending}
                      onChange={(e) => {
                        handleChange(field.label, e);
                      }}
                    />
                    {errors[field.label]?.[0] && (
                      <FieldError>{errors[field.label]?.[0]}</FieldError>
                    )}
                  </Field>
                );
              })}
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

export default ResourceChange;
