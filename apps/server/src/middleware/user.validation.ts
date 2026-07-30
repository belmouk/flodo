import {
  UserLogin,
  UserLoginSchema,
  UserSignup,
  UserSignupSchema,
} from "../auth/auth.schema.js";
import { ApiError } from "@repo/utils";
import { Request, Response, NextFunction } from "express";
import * as z from "zod";

export const validateUserSignup = (
  req: Request<unknown, unknown, UserSignup>,
  res: Response,
  next: NextFunction
) => {
  const result = UserSignupSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  } else if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError("Invalid SignUp data.", 400, "InvalidDataError", errors);
  }
};

export const validateUserLogin = (
  req: Request<unknown, unknown, UserLogin>,
  res: Response,
  next: NextFunction
) => {
  const result = UserLoginSchema.safeParse(req.body);
  if (result.success) {
    req.body = result.data;
    return next();
  } else {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError("Invalid Login data.", 400, "LoginError", errors);
  }
};
