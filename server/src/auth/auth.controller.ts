import * as services from "./auth.services.js";
import { Request, Response } from "express";
import { UserLogin, UserSignup } from "./auth.schema.js";
import CONFIG from "../lib/config.js";
import ApiError from "../lib/ApiError.js";
import { getById } from "../users/users.services.js";

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
    services.createAccessToken(user.id),
    services.createRefreshToken(user.id),
  ]);

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
  });

  return res.sendStatus(204);
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError("Missing refresh token", 401, "MissingToken");

  const validatedRefreshToken = await services.validateRefreshToken(token);

  const user = await getById(validatedRefreshToken.userId);
  if (!user) {
    await services.deleteRefreshToken(token);
    throw new ApiError("Invalid token", 401, "InvalidRefreshToken");
  }
  const { refreshToken, accessToken } = await services.createNewTokens(
    validatedRefreshToken,
  );

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

  return res.json(user);
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await services.deleteRefreshToken(refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api",
    });
  }
  return res.sendStatus(204);
};
