import * as services from "./auth.services.js";
import { Request, Response, NextFunction } from "express";

interface User {
  username: string;
  email: string;
  password: string;
}

export const signup = async (req: Request<any, any, User>, res: Response) => {
  const user = await services.createUser(req.body);
  return res.status(200).json(user);
};
