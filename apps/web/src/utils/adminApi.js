const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, { token, ...opts } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(token),
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return data;
}

export const adminApi = {
  login: (email, password) =>
    request("/admin-pulse/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  summary: (token) => request("/admin-pulse/analytics/summary", { token }),
  timeline: (token, days = 30) =>
    request(`/admin-pulse/analytics/timeline?days=${days}`, { token }),
  waitlist: (token, page = 1, limit = 50) =>
    request(`/admin-pulse/waitlist?page=${page}&limit=${limit}`, { token }),
  contacts: (token, page = 1, limit = 50) =>
    request(`/admin-pulse/contacts?page=${page}&limit=${limit}`, { token }),
  users: (token, page = 1, limit = 50) =>
    request(`/admin-pulse/users?page=${page}&limit=${limit}`, { token }),
};

export default adminApi;