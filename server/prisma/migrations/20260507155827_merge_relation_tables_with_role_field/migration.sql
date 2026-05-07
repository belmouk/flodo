/*
  Warnings:

  - You are about to drop the `ProjectMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectOwner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskAssignee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskAssigner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamUserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ProjectUserRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "TaskUserRole" AS ENUM ('ASSIGNER', 'ASSIGNEE');

-- CreateEnum
CREATE TYPE "WorkspaceUserRole" AS ENUM ('ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_member_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_project_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectOwner" DROP CONSTRAINT "ProjectOwner_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectOwner" DROP CONSTRAINT "ProjectOwner_project_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_assigned_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_task_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssigner" DROP CONSTRAINT "TaskAssigner_assigned_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssigner" DROP CONSTRAINT "TaskAssigner_task_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamAdmin" DROP CONSTRAINT "TeamAdmin_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamAdmin" DROP CONSTRAINT "TeamAdmin_team_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_member_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_team_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceAdmin" DROP CONSTRAINT "WorkspaceAdmin_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceAdmin" DROP CONSTRAINT "WorkspaceAdmin_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_member_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_workspace_id_fkey";

-- DropTable
DROP TABLE "ProjectMember";

-- DropTable
DROP TABLE "ProjectOwner";

-- DropTable
DROP TABLE "TaskAssignee";

-- DropTable
DROP TABLE "TaskAssigner";

-- DropTable
DROP TABLE "TeamAdmin";

-- DropTable
DROP TABLE "TeamMember";

-- DropTable
DROP TABLE "WorkspaceAdmin";

-- DropTable
DROP TABLE "WorkspaceMember";

-- CreateTable
CREATE TABLE "TeamUser" (
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "userRole" "TeamUserRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamUser_pkey" PRIMARY KEY ("user_id","team_id")
);

-- CreateTable
CREATE TABLE "ProjectUser" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userRole" "ProjectUserRole" NOT NULL,

    CONSTRAINT "ProjectUser_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "TaskUser" (
    "stakeholder_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userRole" "TaskUserRole" NOT NULL,

    CONSTRAINT "TaskUser_pkey" PRIMARY KEY ("stakeholder_id","task_id")
);

-- CreateTable
CREATE TABLE "WorkspaceUser" (
    "user_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userRole" "WorkspaceUserRole" NOT NULL,

    CONSTRAINT "WorkspaceUser_pkey" PRIMARY KEY ("user_id","workspace_id")
);

-- AddForeignKey
ALTER TABLE "TeamUser" ADD CONSTRAINT "TeamUser_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamUser" ADD CONSTRAINT "TeamUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUser" ADD CONSTRAINT "TaskUser_stakeholder_id_fkey" FOREIGN KEY ("stakeholder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUser" ADD CONSTRAINT "TaskUser_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceUser" ADD CONSTRAINT "WorkspaceUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceUser" ADD CONSTRAINT "WorkspaceUser_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
