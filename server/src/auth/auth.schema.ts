import * as z from "zod";

export const UserSignupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(25, "Username cannot exceed 25 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("A valid email address is required")),
  password: z.string().min(6, "Password must be at least 6 characters long"),
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
