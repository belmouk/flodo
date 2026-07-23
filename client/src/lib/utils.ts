import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type ApiError from "../../../server/src/lib/ApiError";

const apiUrl = import.meta.env.VITE_API_URL;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ApiResult<T> =
  | { success: false; error: ApiError }
  | { success: true; data: T };

export const fetchApi = async <T>(
  url: string,
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH",
  body?: Record<string, unknown>,
  retry = false,
): Promise<ApiResult<T>> => {
  const res = await fetch(apiUrl + url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    if (res.status === 204) return { success: true, data: undefined as T };
    return { success: true, data: (await res.json()) as T };
  }
  if (res.status === 400)
    return { success: false, error: (await res.json()) as ApiError };
  if (res.status !== 401) throw new Response(null, { status: res.status });

  if (retry) {
    return {
      success: false,
      error: (await res.json()) as ApiError,
    };
  }

  const err = (await res.json()) as ApiError;

  if (err.code !== "ExpiredAccessToken" && err.code !== "MissingAccessToken")
    return {
      success: false,
      error: err,
    };

  const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok)
    return {
      success: false,
      error: (await refreshRes.json()) as ApiError,
    };

  return fetchApi(url, method, body, true);
};
