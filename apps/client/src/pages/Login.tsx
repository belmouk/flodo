import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import React, { useState } from "react";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { ApiError } from "@repo/utils";
import { UserLoginSchema } from "@repo/types";

type FormErrors = Record<string, string[] | undefined>;

const apiUrl = import.meta.env.VITE_API_URL;

function Login() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState({
    password: "",
    email: "",
  });
  const mutation = useMutation({
    mutationFn: async (data: typeof input) => {
      const res = await fetch(apiUrl + "/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" },
      });
      if (!res.ok) {
        const errorData = (await res.json()) as ApiError;
        throw errorData;
      }
    },
    onSuccess: () => {
      return navigate("/workspaces");
    },
    onError: (error: ApiError) => {
      if (error.status === 500) throw new Response(null, { status: 500 });
      setErrors(error.details);
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    const result = UserLoginSchema.safeParse(input);
    if (!result.success) {
      const validationErrors = z.flattenError(result.error).fieldErrors;
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const handleChange = (
    field: keyof typeof input,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newInput = { ...input, [field]: e.target.value };
    setInput(newInput);
    setErrors({ ...errors, [field]: undefined, other: undefined });
  };

  return (
    <div className="px-4 w-full max-w-2xl">
      <form className="border rounded-sm p-2" onSubmit={handleSubmit}>
        <FieldSet className="pb-4">
          <FieldLegend className="m-auto">Log In</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@gmail.com"
                autoComplete="email"
                value={input.email}
                disabled={mutation.isPending}
                onChange={(e) => {
                  handleChange("email", e);
                }}
              />
              {errors.email?.[0] && <FieldError>{errors.email[0]} </FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="********"
                disabled={mutation.isPending}
                min={6}
                max={50}
                value={input.password}
                onChange={(e) => {
                  handleChange("password", e);
                }}
              />
              {errors.password?.[0] && (
                <FieldError>{errors.password[0]}</FieldError>
              )}
              {input.password.length < 6 && (
                <FieldDescription>
                  Password must have at least 6 characters
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>
        <Field>
          <Button type="submit" className="py-6" disabled={mutation.isPending}>
            {mutation.isPending ? "Logging in..." : "Log In"}
          </Button>
        </Field>
      </form>
    </div>
  );
}

export default Login;
