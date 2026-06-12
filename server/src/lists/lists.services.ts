import { prisma } from "../lib/prisma.js";

export const index = async (projectId: number) => {
  return await prisma.list.findMany({ where: { projectId } });
};
