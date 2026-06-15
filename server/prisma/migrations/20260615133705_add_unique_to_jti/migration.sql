/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");
