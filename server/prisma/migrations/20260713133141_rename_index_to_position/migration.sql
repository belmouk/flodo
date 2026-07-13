/*
  Warnings:

  - You are about to drop the column `index` on the `lists` table. All the data in the column will be lost.
  - You are about to drop the column `index` on the `tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[position]` on the table `lists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[position]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "lists_index_key";

-- DropIndex
DROP INDEX "tasks_index_key";

-- AlterTable
ALTER TABLE "lists" DROP COLUMN "index",
ADD COLUMN     "position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "index",
ADD COLUMN     "position" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lists_position_key" ON "lists"("position");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_position_key" ON "tasks"("position");
