/*
  Warnings:

  - You are about to drop the `TaskUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `assignee_id` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assigner_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskUser" DROP CONSTRAINT "TaskUser_stakeholder_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskUser" DROP CONSTRAINT "TaskUser_task_id_fkey";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "assignee_id" INTEGER NOT NULL,
ADD COLUMN     "assigner_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "TaskUser";

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigner_id_fkey" FOREIGN KEY ("assigner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
