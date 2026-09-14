const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

let refreshPromise = null;

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
    const csrfToken = getCookie("csrfToken");
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });
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
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to complete that request");
  }

  return result.data;
}