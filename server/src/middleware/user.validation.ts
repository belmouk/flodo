import {
  UserLogin,
  UserLoginSchema,
  UserSignup,
  UserSignupSchema,
} from "../auth/auth.schema.js";
import ApiError from "../lib/ApiError.js";
import { Request, Response, NextFunction } from "express";
import * as z from "zod";

interface ValidationError<T extends { message: string } = { message: string }> {
  firstName?: T[];
  lastName?: T[];
  email?: T[];
  password?: T[];
}

interface InputError {
  firstName?: string[];
  lastName?: string[];
  email?: string[];
  password?: string[];
}

const formatErrorDetails = (errors: InputError) => {
  let newErrors: ValidationError = {};
  const FIELDS = ["firstName", "lastName", "password", "email"] as const;
  for (let field of FIELDS) {
    if (Object.keys(errors).includes(field)) {
      newErrors[field] = errors[field]!.map((err) => ({
        message: err,
      }));
    }
  }
  return newErrors;
};

export const validateUserSignup = (
  req: Request<any, any, UserSignup>,
  res: Response,
  next: NextFunction,
) => {
  const result = UserSignupSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  } else if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError(
      "Invalid SignUp data.",
      400,
      "InvalidDataError",
      formatErrorDetails(errors),
    );
  }
};

export const validateUserLogin = (
  req: Request<any, any, UserLogin>,
  res: Response,
  next: NextFunction,
) => {
  const result = UserLoginSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  } else {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError(
      "Invalid Login data.",
      400,
      "LoginError",
      formatErrorDetails(errors),
    );
  }
};
