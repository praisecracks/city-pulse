require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { JWT_SECRET, JWT_EXPIRES_IN } = require("../src/config/jwt");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");
const Notification = require("../src/models/notification.model");
const Report = require("../src/models/report.model");

const BASE = "http://localhost:5000/api/v1";

const tokenFor = (u) =>
  jwt.sign({ userId: u._id, phone: u.phone, roles: u.roles }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

(async () => {
  await connectDB();

  const pulse = await Pulse.findOne({});
  if (!pulse) throw new Error("No pulse in the database to report");

  const provider = await User.findById(pulse.agent);
  const reporter = await User.findOne({ _id: { $ne: pulse.agent } });
  if (!provider || !reporter) throw new Error("Need a provider and a distinct reporter");

  console.log(`\nListing : ${pulse.title} (trust ${pulse.trustScore})`);
  console.log(`Provider: ${provider.name} <${provider.phone}>`);
  console.log(`Reporter: ${reporter.name} <${reporter.phone}>\n`);

  // Clean slate so the assertions below are unambiguous.
  await Notification.deleteMany({ user: provider._id });
  await Report.deleteMany({ pulse: pulse._id, reporter: reporter._id });

  const providerToken = tokenFor(provider);
  const reporterToken = tokenFor(reporter);

  // --- 1. Empty feed, before anything happens ---------------------------------
  const before = await api("/notifications", { token: providerToken });
  console.log(`1. GET /notifications (empty)      -> ${before.status}`);
  console.log(`   unreadCount = ${before.body.unreadCount}, count = ${before.body.count}\n`);

  // --- 2. File a report as the other account ---------------------------------
  const report = await api(`/pulses/${pulse._id}/reports`, {
    method: "POST",
    token: reporterToken,
    body: { reason: "price_mismatch", note: "Charged double for delivery." },
  });
  console.log(`2. POST /pulses/:id/reports       -> ${report.status}`);
  console.log(`   trustScore after = ${report.body.trustScore}\n`);

  // --- 3. The provider's feed ------------------------------------------------
  const after = await api("/notifications", { token: providerToken });
  console.log(`3. GET /notifications (after)     -> ${after.status}`);
  console.log(`   unreadCount = ${after.body.unreadCount}`);
  for (const n of after.body.data) {
    console.log(`   - [${n.type}] ${n.title}`);
    console.log(`     body:    ${n.body}`);
    console.log(`     action:  ${n.action}`);
    console.log(`     read:    ${n.readAt === null ? "UNREAD" : "read"}`);
    // PRD F8: the reporter's identity must never reach the reported agent.
    const leak = JSON.stringify(n).toLowerCase();
    const leaked = reporter.phone.toLowerCase() || reporter.name.toLowerCase();
    console.log(`     reporter identity leaked? ${leak.includes(leaked) ? "YES - BUG" : "no"}`);
  }
  console.log();

  // --- 4. Unread count + mark read ------------------------------------------
  const unread = await api("/notifications/unread-count", { token: providerToken });
  console.log(`4. GET /notifications/unread-count -> ${unread.status} (${unread.body.unreadCount})`);

  const first = after.body.data[0];
  const marked = await api(`/notifications/${first._id}/read`, {
    method: "PATCH",
    token: providerToken,
  });
  console.log(`5. PATCH /notifications/:id/read  -> ${marked.status}`);

  const unread2 = await api("/notifications/unread-count", { token: providerToken });
  console.log(`   unreadCount now = ${unread2.body.unreadCount}\n`);

  // --- 6. Account scoping ---------------------------------------------------
  const asOther = await api("/notifications", { token: reporterToken });
  console.log(`6. Reporter reads own feed         -> ${asOther.status}, count = ${asOther.body.count} (expect 0)`);

  const crossRead = await api(`/notifications/${first._id}/read`, {
    method: "PATCH",
    token: reporterToken,
  });
  console.log(`   Reporter marks provider's notif  -> ${crossRead.status} (expect 404)\n`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
