import { prisma } from "@repo/db";

export const getById = async (userId: number) => {
  return await prisma.user.findUnique({ where: { id: userId } });
};
