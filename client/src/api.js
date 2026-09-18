const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

let refreshPromise = null;
let currentCsrfToken = "";

try {
  currentCsrfToken = sessionStorage.getItem("csrfToken") || "";
} catch {
  // Ignore sessionStorage errors
}

export function setStoredCsrfToken(token) {
  if (token && typeof token === "string") {
    currentCsrfToken = token;
    try {
      sessionStorage.setItem("csrfToken", token);
    } catch {
      // Ignore
    }
  }
}

export function clearStoredCsrfToken() {
  currentCsrfToken = "";
  try {
    sessionStorage.removeItem("csrfToken");
  } catch {
    // Ignore
  }
}

const csrfProtectedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCookie(name) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));

  return value ? decodeURIComponent(value.slice(prefix.length)) : "";
}

async function rawFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (csrfProtectedMethods.has(method)) {
    const csrfToken = currentCsrfToken || getCookie("csrfToken");
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });

  const responseCsrf = response.headers.get("x-csrf-token");
  if (responseCsrf) {
    setStoredCsrfToken(responseCsrf);
  }

  return response;
}

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = rawFetch("/auth/refresh", { method: "POST" })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function api(path, options = {}) {
  let response = await rawFetch(path, options);

  if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await rawFetch(path, options);
    }
  } else if (response.status === 403 && !options._retriedCsrf && path !== "/auth/login") {
    try {
      const meRes = await rawFetch("/auth/me");
      if (meRes.ok) {
        response = await rawFetch(path, { ...options, _retriedCsrf: true });
      }
    } catch {
      // Ignore retry error and continue
    }
  }

  const result = await response.json().catch(() => ({}));
  if (result?.data?.csrfToken) {
    setStoredCsrfToken(result.data.csrfToken);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to complete that request");
  }

  return result.data;
}