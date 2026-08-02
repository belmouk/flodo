import { prisma } from "@repo/db";

export const getUserById = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });
};
