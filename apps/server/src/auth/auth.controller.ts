import * as services from "./auth.services.js";
import type { Request, Response, NextFunction } from "express";
import type { UserLogin, UserSignup } from "@repo/types";
import CONFIG from "../lib/config.js";
import { ApiError } from "@repo/utils";
import { getById } from "../users/users.services.js";
import { UserLoginSchema, UserSignupSchema } from "@repo/types";
import * as z from "zod";

export const signup = async (
  req: Request<unknown, unknown, UserSignup>,
  res: Response
) => {
  const user = await services.createUser(req.body);
  return res.status(201).json(user);
};

export const login = async (
  req: Request<unknown, unknown, UserLogin>,
  res: Response
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
    path: "/",
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.sendStatus(204);
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token)
    throw new ApiError("Missing refresh token", 401, "MissingRefreshToken");

  const result = await services.validateRefreshToken(token);
  if (!result.success) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    throw new ApiError("Invalid refresh token", 401, result.error);
  }
  const validatedRefreshToken = result.data;
  const user = await getById(validatedRefreshToken.userId);
  if (!user) {
    await services.deleteRefreshToken(token);
    throw new ApiError("Invalid token", 401, "InvalidRefreshToken");
  }
  const { refreshToken, accessToken } = await services.createNewTokens(
    validatedRefreshToken
  );

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    secure: CONFIG.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.json(user);
};

export const logout = async (req: Request, res: Response) => {
  console.log(req.cookies);
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (refreshToken) {
    await services.deleteRefreshToken(refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
  return res.sendStatus(204);
};

export const me = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    throw new ApiError("Missing refresh Token", 401, "MissingRefreshToken");
  }
  const accessToken = req.cookies?.accessToken as string | undefined;
  if (!accessToken)
    throw new ApiError("Expired access token", 401, "ExpiredAccessToken");
  const user = await services.getUserId(accessToken);
  if (!user) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    throw new ApiError("Invalid access token", 401, "InvalidAccessToken");
  }
  return res.json(user);
};

export const validateUserSignup = (
  req: Request,
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
  req: Request,
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
