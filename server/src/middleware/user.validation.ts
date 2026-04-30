import { UserSignup, UserSignupSchema } from "../auth/auth.schema.js";
import ApiError from "../lib/ApiError.js";
import { Request, Response, NextFunction } from "express";
import * as z from "zod";

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
    const errors = z.flattenError(result.error);
    return next(
      new ApiError("Invalid SignUp data.", 400, "InvalidDataError", errors),
    );
  }
};
