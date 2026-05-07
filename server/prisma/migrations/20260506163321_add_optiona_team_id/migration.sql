-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_team_id_fkey";

-- AlterTable
ALTER TABLE "workspaces" ALTER COLUMN "team_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
