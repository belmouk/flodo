import * as services from "./auth.services.js";
import { Request, Response } from "express";
import { UserSignup } from "./auth.schema.js";

export const signup = async (
  req: Request<any, any, UserSignup>,
  res: Response,
) => {
  const user = await services.createUser(req.body);
  return res.status(201).json(user);
};
