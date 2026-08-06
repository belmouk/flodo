import PublicLayout from "./pages/PublicLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ErrorBoundary from "./pages/ErrorBoundary";
import ProtectedLayout from "./pages/ProtectedLayout";
import { redirect, type LoaderFunctionArgs } from "react-router";
import type { User } from "@repo/db";
import Workspaces from "./pages/Workspaces";
import Workspace from "./pages/Workspace";
import { fetchApi } from "./lib/utils";
import Project from "./pages/Project";
import * as z from "zod";

const publicLoader = async () => {
  const result = await fetchApi<Omit<User, "password">>("/auth/me", "GET");
  if (result.success) throw redirect("/workspaces");
  return null;
};

const protectedLoader = async () => {
  const result = await fetchApi<User>("/auth/me", "GET");
  if (!result.success) throw redirect("/login");
  return result.data;
};

const workspaceParamsSchema = z.object({
  workspaceId: z.coerce.number().positive().int().min(1),
});

const projectParamsSchema = z.object({
  workspaceId: z.coerce.number().positive().int().min(1),
  projectId: z.coerce.number().positive().int().min(1),
});

export const WorkspaceLoader = ({ params }: LoaderFunctionArgs) => {
  const result = workspaceParamsSchema.safeParse(params);
  if (!result.success) throw new Response(null, { status: 404 });
  return result.data;
};

export const ProjectLoader = ({ params }: LoaderFunctionArgs) => {
  const result = projectParamsSchema.safeParse(params);
  if (!result.success) throw new Response(null, { status: 404 });
  return result.data;
};

const routes = [
  {
    path: "/",
    ErrorBoundary,
    children: [
      {
        Component: PublicLayout,
        loader: publicLoader,
        children: [
          { index: true, Component: Home },
          { path: "signup", Component: Signup },
          { path: "login", Component: Login },
        ],
      },
      {
        Component: ProtectedLayout,
        loader: protectedLoader,
        children: [
          {
            path: "workspaces",
            Component: Workspaces,
            children: [
              {
                path: ":workspaceId",
                Component: Workspace,
                loader: WorkspaceLoader,
              },
            ],
          },
          {
            path: "workspaces/:workspaceId/projects/:projectId",
            Component: Project,
            loader: ProjectLoader,
          },
        ],
      },
    ],
  },
];

export default routes;
