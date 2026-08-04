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
import type { Workspace, Project, Task, List } from "@repo/db";
import type { ProjectWithLists } from "@/pages/Project";
import { toast } from "sonner";

type HTTPRequestType =
  | { method: "POST"; url: string }
  | { method: "PUT" | "PATCH"; url: string; itemId: number; parentId?: number };

type FormValues = Record<string, string>;

type FieldDef<T extends FormValues> = {
  label: keyof T;
  type: "number" | "date" | "text";
};

type ResourceChangeProps<T extends FormValues> = {
  HTTPRequest: HTTPRequestType;
  schema: z.ZodType;
  cleanInput: T;
  queryKeysToInvalidate: string[];
  fields: FieldDef<T>[];
  UpdateIcon: React.ReactNode;
  CreateIcon: React.ReactNode;
  resource: "workspace" | "project" | "list" | "task";
};

function ResourceChange<T extends FormValues>({
  HTTPRequest,
  cleanInput,
  schema,
  queryKeysToInvalidate,
  fields,
  UpdateIcon,
  CreateIcon,
  resource,
}: ResourceChangeProps<T>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string[]>>>({});
  const [input, setInput] = useState<T>(cleanInput);
  const mutation = useMutation({
    mutationFn: async (payload: T) => {
      const res = await fetchApi<T>(
        HTTPRequest.url,
        HTTPRequest.method,
        payload,
      );
      if (!res.success) throw res.error;
      return res.data;
    },
    onError(error: ApiError) {
      if (error.status === 401) {
        return navigate("/login");
      } else if (error.status === 400) {
        setErrors(error.details as Partial<Record<keyof T, string[]>>);
      } else {
        toast.error(error.message);
      }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeysToInvalidate });
      setInput(cleanInput);
      setErrors({});
      setOpen(false);
      if (resource === "workspace") {
        await navigate(`/workspaces/${String(data.id)}`);
      }
    },
  });

  const isEdit = HTTPRequest.method === "PUT" || HTTPRequest.method === "PATCH";

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
    field: keyof T,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInput((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const populateFromCache = (): T | null => {
    if (!isEdit) return null;

    let cachedItem: Record<string, unknown> | null;

    if (resource === "list") {
      const cache = queryClient.getQueryData<ProjectWithLists>(
        queryKeysToInvalidate,
      );
      cachedItem =
        cache?.lists.find((list) => list.id === HTTPRequest.itemId) ?? null;
    } else if (resource === "task") {
      const cache = queryClient.getQueryData<ProjectWithLists>(
        queryKeysToInvalidate,
      );
      const parentList = cache?.lists.find(
        (list) => list.id === HTTPRequest.parentId,
      );
      cachedItem =
        parentList?.tasks.find((task) => task.id === HTTPRequest.itemId) ??
        null;
    } else {
      const cache = queryClient.getQueryData<Workspace[] | Project[]>(
        queryKeysToInvalidate,
      );
      cachedItem =
        cache?.find((item) => item.id === HTTPRequest.itemId) ?? null;
    }

    if (!cachedItem) return null;

    const newInput = { ...cleanInput };
    for (const key of Object.keys(newInput) as (keyof T)[]) {
      const type = fields.find((f) => f.label === String(key))?.type;
      const value = String(cachedItem[key as string] ?? "");
      if (type === "date") {
        newInput[key] = new Date(value).toISOString() as T[keyof T];
      } else {
        newInput[key] = value as T[keyof T];
      }
    }
    return newInput;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
      setInput(cleanInput);
    } else if (isEdit) {
      const populated = populateFromCache();
      if (populated) setInput(populated);
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button className="hover:cursor-pointer" variant={"ghost"}>
              {isEdit ? UpdateIcon : CreateIcon}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{isEdit ? "Edit" : "Add"}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${resource}` : `New ${resource}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? `Update your ${resource}` : `Create a new ${resource}`}
          </DialogDescription>
        </DialogHeader>
        <form method="POST" onSubmit={handleSubmit}>
          <FieldSet className="mb-4">
            <FieldGroup>
              {fields.map((field) => {
                const fieldKey = String(field.label);
                const fieldValue =
                  field.type === "date"
                    ? input[fieldKey].split("T")[0]
                    : String(input[fieldKey] ?? "");

                return (
                  <Field key={fieldKey}>
                    <FieldLabel htmlFor={fieldKey}>
                      {fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                    </FieldLabel>
                    <Input
                      type={field.type}
                      name={fieldKey}
                      id={fieldKey}
                      value={fieldValue}
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
