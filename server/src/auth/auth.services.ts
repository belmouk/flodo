import ApiError from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";

interface User {
  username: string;
  password: string;
  email: string;
}

export const createUser = async ({ username, password, email }: User) => {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    const isEmail = existingUser.email === email;
    throw new ApiError(
      isEmail ? "Email taken" : "Username taken",
      400,
      "UserExistsError",
      {
        [isEmail ? "email" : "username"]: {
          message: "Username or email already exists",
        },
      },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return await prisma.user.create({
    data: { username, email, password: hashedPassword },
    omit: { password: true },
  });
};
