import PublicLayout from "./pages/PublicLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ErrorBoundary from "./pages/ErrorBoundary";
import ProtectedLayout from "./pages/ProtectedLayout";
import { redirect } from "react-router";
import type { User } from "../../server/src/users/users.schema";
import Workspaces from "./pages/Workspaces";

const apiUrl = import.meta.env.VITE_API_URL;

export type LoaderData = User;

type ApiResult<T> =
  | { success: false; error: string }
  | { success: true; data: T };

const fetchApi = async <T>(
  url: string,
  method: "POST" | "GET" | "PUT" | "DELETE",
  body?: Record<string, any>,
  retry = false,
): Promise<ApiResult<T>> => {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) return { success: true, data: await res.json() };

  if (res.status !== 401) throw new Response(null, { status: res.status });

  if (retry) return { success: false, error: "Unauthorized" };

  const err = await res.json();

  if (err.code !== "ExpiredAccessToken")
    return { success: false, error: "Unauthorized" };

  const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) return { success: false, error: "Unauthorized" };

  return fetchApi(url, method, body, true);
};

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
          { path: "workspaces", Component: Workspaces },
          { path: "workspaces/:workspaceId/projects/:projectId" },
        ],
      },
    ],
  },
];

export default routes;
