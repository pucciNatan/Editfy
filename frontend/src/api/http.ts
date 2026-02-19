// src/api/http.ts
import { authStorage } from "@/lib/authStorage";

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8000";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
const pendingQueue: Array<() => void> = [];

async function runQueue() {
  pendingQueue.splice(0).forEach((resolve) => resolve());
}

async function doRefresh(): Promise<string> {
  const refresh = authStorage.getRefresh();
  if (!refresh) throw new Error("Sem refresh token");

  const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    authStorage.clear();
    throw new Error("Falha ao renovar sessão");
  }

  const { access } = await res.json();
  authStorage.setAccess(access);
  return access;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  auth?: boolean; // default true
  headers?: Record<string, string>;
};

async function request<T>(
  path: string,
  { method = "GET", body, auth = true, headers = {} }: RequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const h: Record<string, string> = { Accept: "application/json", ...headers };

  let access = authStorage.getAccess();
  if (auth && access) h["Authorization"] = `Bearer ${access}`;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !h["Content-Type"]) {
    h["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    method,
    headers: h,
    body:
      body !== undefined
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  });

  if (auth && res.status === 401) {
    try {
      // lock de refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefresh().finally(() => {
          isRefreshing = false;
        }) as Promise<string>;
      }

      await refreshPromise;

      await new Promise<void>((resolve) => {
        pendingQueue.push(resolve);
        if (!isRefreshing) runQueue();
      });

      // refaz a request com novo access
      access = authStorage.getAccess();
      const retryHeaders: Record<string, string> = {
        ...h,
      };
      if (access) retryHeaders["Authorization"] = `Bearer ${access}`;

      res = await fetch(url, {
        method,
        headers: retryHeaders,
        body:
          body !== undefined
            ? isFormData
              ? body
              : JSON.stringify(body)
            : undefined,
      });
    } catch (e) {
      authStorage.clear();
      throw e;
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} falhou (${res.status}): ${text}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  // fallback
  return (await res.text()) as unknown as T;
}

export function httpGet<T>(
  path: string,
  opts?: Omit<RequestOptions, "method" | "body">
) {
  return request<T>(path, { ...opts, method: "GET" });
}

export function httpPost<T>(
  path: string,
  body?: any,
  opts?: Omit<RequestOptions, "method">
) {
  return request<T>(path, { ...opts, method: "POST", body });
}

export function httpPut<T>(
  path: string,
  body?: any,
  opts?: Omit<RequestOptions, "method">
) {
  return request<T>(path, { ...opts, method: "PUT", body });
}

export function httpPatch<T>(
  path: string,
  body?: any,
  opts?: Omit<RequestOptions, "method">
) {
  return request<T>(path, { ...opts, method: "PATCH", body });
}

export function httpDelete<T>(
  path: string,
  opts?: Omit<RequestOptions, "method" | "body">
) {
  return request<T>(path, { ...opts, method: "DELETE" });
}
