/**
 * Lightweight analytics for the public marketing site.
 *
 * Sends pageview + event pings to POST /api/v1/analytics/track.
 * No PII is sent — only an event name, optional metadata, and a session id
 * so the same visitor starting two forms counts as two starts.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

function sessionId() {
  let id = localStorage.getItem("cp_session_id");
  if (!id) {
    id = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cp_session_id", id);
  }
  return id;
}

async function send(kind, fields = {}) {
  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, sessionId: sessionId(), ...fields }),
    });
  } catch {
    // Fire-and-forget: a failed ping must never break the UI.
  }
}

export function trackPageview(path) {
  send("pageview", { path });
}

export function trackEvent(event, meta = {}) {
  send("event", { event, meta });
}