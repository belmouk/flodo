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
import type { User } from "@repo/db";
import type { ApiError } from "@repo/utils";
import { UserSignupSchema } from "@repo/types";

type FormErrors = Record<string, string[] | undefined>;

const apiUrl = import.meta.env.VITE_API_URL;

function Signup() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FormErrors>({});
  const [input, setInput] = useState({
    firstName: "",
    lastName: "",
    password: "",
    email: "",
  });
  const mutation = useMutation({
    mutationFn: async (data: typeof input) => {
      const res = await fetch(apiUrl + "/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" },
      });
      if (res.ok) return (await res.json()) as User;
      const errorData = (await res.json()) as ApiError;
      throw errorData;
    },
    onSuccess: () => {
      return navigate("/login");
    },
    onError: (error: ApiError) => {
      if (error.status === 500) throw new Response(null, { status: 500 });
      setErrors(error.details);
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    const result = UserSignupSchema.safeParse(input);
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
    setErrors({ ...errors, [field]: undefined });
  };

  return (
    <div className="px-4 w-full max-w-2xl">
      <form className="border rounded-sm p-2" onSubmit={handleSubmit}>
        <FieldSet className="pb-4">
          <FieldLegend className="m-auto">Sign Up</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="John"
                autoComplete="given-name"
                min={1}
                max={100}
                disabled={mutation.isPending}
                value={input.firstName}
                onChange={(e) => {
                  handleChange("firstName", e);
                }}
              />
              {errors.firstName?.[0] && (
                <FieldError>{errors.firstName[0]}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Doe"
                autoComplete="family-name"
                value={input.lastName}
                disabled={mutation.isPending}
                onChange={(e) => {
                  handleChange("lastName", e);
                }}
                min={1}
                max={100}
              />
              {errors.lastName?.[0] && (
                <FieldError>{errors.lastName[0]}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@gmail.com"
                autoComplete="email"
                disabled={mutation.isPending}
                value={input.email}
                onChange={(e) => {
                  handleChange("email", e);
                }}
              />
              {errors.email?.[0] && <FieldError>{errors.email[0]}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                type="password"
                id="password"
                name="password"
                disabled={mutation.isPending}
                placeholder="********"
                value={input.password}
                onChange={(e) => {
                  handleChange("password", e);
                }}
                min={6}
                max={50}
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
            {mutation.isPending ? "Signing up..." : "Sign up"}
          </Button>
        </Field>
      </form>
    </div>
  );
}

export default Signup;
