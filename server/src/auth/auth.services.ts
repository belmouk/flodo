import ApiError from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { UserLogin, UserSignup } from "./auth.schema.js";
import { jwtVerify, SignJWT } from "jose";
import CONFIG from "../lib/config.js";
import { randomUUID } from "node:crypto";

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

export const generateJWT = async ({
  userId,
  secret,
  payload,
  type,
}: {
  userId: number;
  secret: string;
  payload: Record<string, any>;
  type: "access" | "refresh";
}) => {
  const encodedSecret = new TextEncoder().encode(secret);
  const jti = randomUUID();
  const expiresAt =
    type === "access"
      ? new Date(Date.now() + 15 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT(payload)
    .setSubject(userId.toString())
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setAudience(CONFIG.JWT_AUDIENCE)
    .setIssuer(CONFIG.JWT_ISSUER)
    .setJti(jti)
    .sign(encodedSecret);

  return { token, jti, expiresAt };
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

export const refreshTokens = async (refreshToken: {
  token: string;
  jti: string;
  expiresAt: Date;
}) => {
  const token = await prisma.refreshToken.findFirst({
    where: { jti: refreshToken.jti },
  });
  if (!token) throw new ApiError("Invalid token", 401, "MissingToken");
  if (new Date(token.expiresAt) < new Date(Date.now())) {
    await prisma.refreshToken.deleteMany({ where: { id: token.id } });
    throw new ApiError("Expired token", 401, "ExpiredToken");
  }

  const jwtRefreshSecret = new TextEncoder().encode(
    CONFIG.REFRESH_TOKEN_SECRET,
  );
  const { payload } = await jwtVerify(token.token, jwtRefreshSecret, {
    issuer: CONFIG.JWT_ISSUER,
    audience: CONFIG.JWT_AUDIENCE,
  });

  if (typeof payload.sub === "string") {
    const userId = parseInt(payload.sub, 10);
    const newRefreshToken = await generateJWT({
      userId,
      secret: CONFIG.REFRESH_TOKEN_SECRET,
      payload: {},
      type: "refresh",
    });
    const newAccessToken = await generateJWT({
      userId,
      secret: CONFIG.ACCESS_TOKEN_SECRET,
      payload: {},
      type: "access",
    });

    await prisma.refreshToken.update({
      data: {
        token: newRefreshToken.token,
        jti: newRefreshToken.jti,
        expiresAt: newRefreshToken.expiresAt,
      },
      where: { id: token.id },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } else {
    throw new ApiError("Error parsing JWT payload", 500, "JWTParsing");
  }
};
