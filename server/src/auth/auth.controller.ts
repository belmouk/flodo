import * as services from "./auth.services.js";
import { NextFunction, Request, Response } from "express";
import { UserLogin, UserSignup } from "./auth.schema.js";
import CONFIG from "../lib/config.js";
import ApiError from "../lib/ApiError.js";

export const signup = async (
  req: Request<any, any, UserSignup>,
  res: Response,
) => {
  const user = await services.createUser(req.body);
  return res.status(201).json(user);
};

export const login = async (
  req: Request<any, any, UserLogin>,
  res: Response,
) => {
  const user = await services.verifyLoginCredentials(req.body);
  const [accessToken, refreshToken] = await Promise.all([
    services.generateJWT({
      type: "access",
      userId: user.id,
      secret: CONFIG.ACCESS_TOKEN_SECRET,
      payload: {},
    }),
    services.generateJWT({
      type: "refresh",
      userId: user.id,
      secret: CONFIG.REFRESH_TOKEN_SECRET,
      payload: {},
    }),
  ]);
  await services.saveRefreshToken({ userId: user.id, refreshToken });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });

  return res.sendStatus(204);
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.refreshToken;

  if (!token) throw new ApiError("Missing refresh token", 401, "MissingToken");
  const { refreshToken, accessToken } = await services.refreshTokens(token);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });

  return res.sendStatus(204);
};
