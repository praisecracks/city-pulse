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
  pendingListings: (token, page = 1, limit = 20) =>
    request(`/admin-pulse/listings?page=${page}&limit=${limit}`, { token }),
  reviewListing: (token, listingId, reviewStatus, note) =>
    request(`/admin-pulse/listings/${encodeURIComponent(listingId)}/review`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ reviewStatus, note }),
    }),
};

export default adminApi;