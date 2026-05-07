import { Request, Response, NextFunction } from "express";
import { jwtVerify, errors } from "jose";
import CONFIG from "../lib/config.js";
import ApiError from "../lib/ApiError.js";

export const ensureAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken: string = req.cookies?.accessToken;

  if (accessToken) {
    const encodedSecret = new TextEncoder().encode(CONFIG.ACCESS_TOKEN_SECRET);
    try {
      const { payload } = await jwtVerify(accessToken, encodedSecret, {
        issuer: CONFIG.JWT_ISSUER,
        audience: CONFIG.JWT_AUDIENCE,
      });

      if (payload.sub) {
        req.body = { ...req.body, userId: parseInt(payload.sub, 10) };
        return next();
      } else {
        throw new ApiError("Invalid Access Token", 401, "InvalidAccessToken");
      }
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new ApiError("Expired Access Token", 401, "ExpiredAccessToken");
      }
      if (error instanceof errors.JWTInvalid) {
        throw new ApiError("Invalid Access Token", 401, "InvalidAccessToken");
      }
      next(error);
    }
  } else {
    throw new ApiError("Missing Access Token", 401, "MissingAccessToken");
  }
};

export default ensureAuth;
