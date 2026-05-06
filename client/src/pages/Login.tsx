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

interface ValidationError<T extends { message: string } = { message: string }> {
  email?: T[];
  password?: T[];
  other?: T[];
}

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("A valid email address is required")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(50, "Password too long"),
});

const apiUrl = import.meta.env.VITE_API_URL;

function Login() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ValidationError>({});
  const [input, setInput] = useState({
    password: "",
    email: "",
  });
  const mutation = useMutation({
    mutationFn: async (data: typeof input) => {
      if (mutation.isPending) return;
      const result = schema.safeParse(data);
      if (!result.success) {
        const validationErrors = z.flattenError(result.error).fieldErrors;
        let newErrors: ValidationError = {};
        const FIELDS = ["password", "email"] as const;
        for (let field of FIELDS) {
          if (Object.keys(validationErrors).includes(field)) {
            newErrors[field] = validationErrors[field]!.map((err) => ({
              message: err,
            }));
          }
        }
        setErrors(newErrors);
        throw { code: "Validation" };
      } else {
        const res = await fetch(apiUrl + "/auth/login", {
          method: "POST",
          body: JSON.stringify(result.data),
          headers: { "Content-type": "application/json" },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw errorData;
        }
      }
    },

    onSuccess: () => {
      return navigate("/");
    },
    onError: (error: ApiError) => {
      if (error.status === 500) return navigate("/500");
      if (error.code === "Validation") return;
      if (error.code === "UserDoesNotExist") {
        error["details"] = {
          other: [
            {
              message: "Account does not exist. Verify email or go to signup",
            },
          ],
        };
      }
      if (error.code === "WrongPassword") {
        error["details"] = {
          other: [{ message: "Wrong password. Try again" }],
        };
      }
      if (error.details) {
        setErrors(error.details);
      }
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
                onChange={(e) => handleChange("email", e)}
              />
              {errors.email ? <FieldError errors={errors.email} /> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="********"
                value={input.password}
                onChange={(e) => handleChange("password", e)}
                min={6}
                max={50}
              />
              {errors.password ? <FieldError errors={errors.password} /> : null}
              {input.password.length < 6 && (
                <FieldDescription>
                  Password must have at least 6 characters
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>
        <Field>
          {errors.other ? <FieldError errors={errors.other} /> : null}
        </Field>
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
