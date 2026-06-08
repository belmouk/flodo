/*
  Warnings:

  - You are about to drop the column `project_id` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `list_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "project_id",
ADD COLUMN     "list_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "lists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
