const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

export function adminAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, new URL(API_BASE, window.location.origin).origin).toString();
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, { token, ...opts } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: authHeaders(token),
      ...opts,
    });
  } catch {
    throw new Error("Cannot reach the City Pulse API. Check that the backend is running and that VITE_API_PROXY_TARGET points to its port.");
  }

  if ([502, 503, 504].includes(res.status)) {
    throw new Error(
      API_BASE.startsWith("/")
        ? "The local Vite proxy cannot reach the backend. Start it and confirm VITE_API_PROXY_TARGET matches its port."
        : "The API host cannot reach its backend service. Check the deployed API service and try again.",
    );
  }

  const body = await res.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`The API returned an unreadable response (${res.status}).`);
  }

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
  listings: (token, page = 1, limit = 20, reviewStatus = "pending_review") =>
    request(`/admin-pulse/listings?page=${page}&limit=${limit}&reviewStatus=${encodeURIComponent(reviewStatus)}`, { token }),
  reviewListing: (token, listingId, reviewStatus, note) =>
    request(`/admin-pulse/listings/${encodeURIComponent(listingId)}/review`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ reviewStatus, note }),
    }),
};

export default adminApi;