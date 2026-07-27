import ApiError from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { UserLogin, UserSignup } from "./auth.schema.js";
import { jwtVerify, SignJWT, base64url } from "jose";
import CONFIG from "../lib/config.js";
import { randomUUID } from "node:crypto";
import type { RefreshToken } from "../../generated/prisma/client.js";
import { JWTExpired, JWTInvalid } from "jose/errors";

interface MyTokenPayload {
  iss: string;
  exp: number;
  sub: string;
  iat: number;
  jti: string;
  aud: string;
}

export const createUser = async ({
  firstName,
  lastName,
  password,
  email,
}: UserSignup) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new ApiError("Account already exists", 400, "UserAlreadyExists", {
      email: ["An account using this email already exists"],
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword },
    omit: { password: true },
  });
};

export const verifyLoginCredentials = async ({
  email,
  password,
}: UserLogin) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError("User does not exists", 400, "UserDoesNotExist", {
      email: ["No account is registered with this email"],
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new ApiError("Wrong password", 403, "WrongPassword", {
      password: ["Wrong password"],
    });
  }
  return user;
};

export const createAccessToken = async (userId: number) => {
  const encodedSecret = base64url.decode(CONFIG.ACCESS_TOKEN_SECRET);
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const token = await new SignJWT()
    .setSubject(userId.toString())
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setAudience(CONFIG.JWT_AUDIENCE)
    .setIssuer(CONFIG.JWT_ISSUER)
    .setJti(jti)
    .sign(encodedSecret);

  return token;
};

export const createRefreshToken = async (userId: number) => {
  const encodedSecret = base64url.decode(CONFIG.REFRESH_TOKEN_SECRET);
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setAudience(CONFIG.JWT_AUDIENCE)
    .setIssuer(CONFIG.JWT_ISSUER)
    .setJti(jti)
    .sign(encodedSecret);

  await saveRefreshToken({ userId, refreshToken: { jti, expiresAt } });
  return token;
};

export const saveRefreshToken = async ({
  userId,
  refreshToken,
}: {
  userId: number;
  refreshToken: { jti: string; expiresAt: Date };
}) => {
  const { jti, expiresAt } = refreshToken;
  await prisma.refreshToken.create({
    data: { jti, expiresAt, user: { connect: { id: userId } } },
  });
};

export const createNewTokens = async (refreshToken: RefreshToken) => {
  const [newAccessToken, newRefreshToken] = await Promise.all([
    createAccessToken(refreshToken.userId),
    createRefreshToken(refreshToken.userId),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

type Result =
  { success: true; data: RefreshToken } | { success: false; error: string };

export const validateRefreshToken = async (token: string): Promise<Result> => {
  try {
    const secret = base64url.decode(CONFIG.REFRESH_TOKEN_SECRET);
    const { payload } = await jwtVerify<MyTokenPayload>(token, secret, {
      issuer: CONFIG.JWT_ISSUER,
      audience: CONFIG.JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti, expiresAt: { gt: new Date() } },
    });
    if (!refreshToken) return { success: false, error: "InvalidRefreshToken" };
    return { success: true, data: refreshToken };
  } catch (error) {
    if (error instanceof JWTExpired) {
      return { success: false, error: "ExpiredRefreshToken" };
    }
    if (error instanceof JWTInvalid) {
      return { success: false, error: "InvalidRefreshToken" };
    }
    throw error;
  }
};

export const deleteRefreshToken = async (token: string) => {
  const secret = base64url.decode(CONFIG.REFRESH_TOKEN_SECRET);
  const { payload } = await jwtVerify<MyTokenPayload>(token, secret, {
    audience: CONFIG.JWT_AUDIENCE,
    issuer: CONFIG.JWT_ISSUER,
    algorithms: ["HS256"],
  });
  await prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
};

export const getUserId = async (token: string) => {
  try {
    const secret = base64url.decode(CONFIG.ACCESS_TOKEN_SECRET);
    const { payload } = await jwtVerify<MyTokenPayload>(token, secret, {
      issuer: CONFIG.JWT_ISSUER,
      audience: CONFIG.JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    const userId = parseInt(payload.sub, 10);
    return await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw new ApiError("Expired access token", 401, "ExpiredAccessToken");
    }
    if (error instanceof JWTInvalid) {
      throw new ApiError("Invalid access token", 401, "InvalidAccessToken");
    }
    throw error;
  }
};
