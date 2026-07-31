import * as z from "zod";

export const UserSignupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name required")
    .max(100, "First name too long")
    .transform(
      (val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase(),
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name required")
    .max(100, "Last name too long")
    .transform(
      (val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase(),
    ),
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

export type UserSignup = z.infer<typeof UserSignupSchema>;

export const UserLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("A valid email is required")),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;
