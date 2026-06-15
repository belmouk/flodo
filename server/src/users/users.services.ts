import { prisma } from "../lib/prisma.js";

export const getById = async (userId: number) => {
  return await prisma.user.findUnique({ where: { id: userId } });
};
