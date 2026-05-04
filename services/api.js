const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pm_token");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = options.token || getToken();

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (_error) {
    throw new ApiError("Network request failed. Check your connection and try again.", 0);
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fieldDetails = Array.isArray(payload.details)
      ? payload.details
          .map((detail) => `${detail.field ? `${detail.field}: ` : ""}${detail.message}`)
          .join(" ")
      : "";
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw new ApiError(fieldDetails || payload.message || "Request failed.", response.status, payload.details);
  }

  return payload;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me")
};

export const usersApi = {
  list: (search = "") => request(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`)
};

export const projectsApi = {
  list: (params = {}) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) searchParams.set(key, value);
    }
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request(`/projects${suffix}`);
  },
  get: (projectId) => request(`/projects/${projectId}`),
  create: (payload) => request("/projects", { method: "POST", body: payload }),
  update: (projectId, payload) => request(`/projects/${projectId}`, { method: "PATCH", body: payload }),
  remove: (projectId) => request(`/projects/${projectId}`, { method: "DELETE" })
};

export const tasksApi = {
  list: (projectId) => request(`/projects/${projectId}/tasks`),
  get: (taskId) => request(`/tasks/${taskId}`),
  create: (projectId, payload) => request(`/projects/${projectId}/tasks`, { method: "POST", body: payload }),
  update: (taskId, payload) => request(`/tasks/${taskId}`, { method: "PATCH", body: payload }),
  remove: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" })
};

export const commentsApi = {
  list: (taskId) => request(`/tasks/${taskId}/comments`),
  create: (taskId, payload) => request(`/tasks/${taskId}/comments`, { method: "POST", body: payload })
};

export const activitiesApi = {
  list: (taskId) => request(`/tasks/${taskId}/activities`)
};
