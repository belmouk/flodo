/*
  Warnings:

  - A unique constraint covering the columns `[index]` on the table `lists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[index]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "lists_index_key" ON "lists"("index");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_index_key" ON "tasks"("index");
