import ApiError from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { UserLogin, UserSignup } from "./auth.schema.js";
import { jwtVerify, SignJWT, errors } from "jose";
import CONFIG from "../lib/config.js";
import { randomUUID } from "node:crypto";
import { RefreshToken } from "../prisma/client.js";

export const createUser = async ({
  firstName,
  lastName,
  password,
  email,
}: UserSignup) => {
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });
  if (existingUser) {
    throw new ApiError("Account already exists", 400, "UserAlreadyExists", {
      email: [{ message: "Account already exists" }],
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
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new ApiError("User does not exists", 400, "UserDoesNotExist");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new ApiError("Wrong password", 403, "WrongPassword", {
      password: "Wrong password",
    });
  }
  return user;
};

export const createAccessToken = async (userId: number) => {
  const encodedSecret = new TextEncoder().encode(CONFIG.ACCESS_TOKEN_SECRET);
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
  const encodedSecret = new TextEncoder().encode(CONFIG.REFRESH_TOKEN_SECRET);
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

  await saveRefreshToken({ userId, refreshToken: { jti, expiresAt, token } });
  return token;
};

export const saveRefreshToken = async ({
  userId,
  refreshToken,
}: {
  userId: number;
  refreshToken: { jti: string; expiresAt: Date; token: string };
}) => {
  const { token, jti, expiresAt } = refreshToken;
  await prisma.refreshToken.upsert({
    where: { userId },
    update: { token, jti, expiresAt },
    create: { token, jti, expiresAt, user: { connect: { id: userId } } },
  });
};

export const createNewTokens = async (refreshToken: RefreshToken) => {
  const [newAccessToken, newRefreshToken] = await Promise.all([
    createAccessToken(refreshToken.userId),
    createRefreshToken(refreshToken.userId),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const validateRefreshToken = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(CONFIG.REFRESH_TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: CONFIG.JWT_ISSUER,
      audience: CONFIG.JWT_AUDIENCE,
    });
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });
    if (!refreshToken)
      throw new ApiError("Invalid token", 401, "InvalidRefreshToken");
    if (new Date(refreshToken.expiresAt) < new Date(Date.now())) {
      await prisma.refreshToken.deleteMany({ where: { id: refreshToken.id } });
      throw new ApiError("Expired token", 401, "ExpiredRefreshToken");
    }
    return refreshToken;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new ApiError("Expired Access Token", 401, "ExpiredRefreshToken");
    }
    if (error instanceof errors.JWTInvalid) {
      throw new ApiError("Invalid Access Token", 401, "InvalidRefreshToken");
    }
    throw error;
  }
};

export const deleteRefreshToken = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(CONFIG.REFRESH_TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: CONFIG.JWT_ISSUER,
      audience: CONFIG.JWT_AUDIENCE,
    });
    await prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
  } catch (error) {
    if (error instanceof errors.JOSEError) return;
    throw error;
  }
};
