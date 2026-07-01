import PublicLayout from "./pages/PublicLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ErrorBoundary from "./pages/ErrorBoundary";
import ProtectedLayout from "./pages/ProtectedLayout";
import { redirect } from "react-router";
import type { User } from "../../server/src/users/users.schema";
import Workspaces from "./pages/Workspaces";
import Workspace from "./pages/Workspace";
import { fetchApi } from "./lib/utils";
import Project from "./pages/Project";

const apiUrl = import.meta.env.VITE_API_URL;

export type LoaderData = User;

const publicLoader = async () => {
  const result = await fetchApi<User>(`${apiUrl}/auth/me`, "GET");
  if (result.success) throw redirect("/workspaces");
  return null;
};

const protectedLoader = async () => {
  const result = await fetchApi<User>(`${apiUrl}/auth/me`, "GET");
  if (!result.success) throw redirect("/login");
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
            children: [{ path: ":workspaceId", Component: Workspace }],
          },
          {
            path: "workspaces/:workspaceId/projects/:projectId",
            Component: Project,
          },
        ],
      },
    ],
  },
];

export default routes;
