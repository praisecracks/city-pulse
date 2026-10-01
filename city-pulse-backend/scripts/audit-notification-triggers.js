require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { JWT_SECRET, JWT_EXPIRES_IN } = require("../src/config/jwt");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");
const Notification = require("../src/models/notification.model");
const Report = require("../src/models/report.model");
const { applyFreshnessRule } = require("../src/services/freshnessService");

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

const typesFor = async (userId) => {
  const rows = await Notification.find({ user: userId }).lean();
  return rows.map((n) => n.type);
};

function report(label, fired) {
  console.log(`   ${fired ? "FIRES  " : "MISSING"}  ${label}`);
  return fired;
}

(async () => {
  await connectDB();

  const pulse = await Pulse.findOne({});
  if (!pulse) throw new Error("No pulse to test against");
  const provider = await User.findById(pulse.agent);
  const reporter = await User.findOne({ _id: { $ne: pulse.agent } });
  if (!provider || !reporter) throw new Error("Need a provider and a distinct reporter");

  const providerToken = tokenFor(provider);
  const reporterToken = tokenFor(reporter);

  console.log(`\nListing "${pulse.title}" | provider ${provider.name} | trust ${pulse.trustScore}\n`);

  // Restore a clean, known starting state.
  await Notification.deleteMany({ user: provider._id });
  await Report.deleteMany({ pulse: pulse._id });
  pulse.trustScore = 3;
  pulse.status = "Available";
  pulse.lastUpdated = new Date();
  await pulse.save();
  await User.findByIdAndUpdate(provider._id, { trustScore: 3 });

  // --- 1. Listing reported ---------------------------------------------------
  const r1 = await api(`/pulses/${pulse._id}/reports`, {
    method: "POST",
    token: reporterToken,
    body: { reason: "unsafe_or_dishonest", note: "Took my money and did not deliver." },
  });
  const trustAfter = r1.body.trustScore;
  const t1 = await typesFor(provider._id);
  console.log(`1. Listing reported  (POST -> ${r1.status}, trust 3 -> ${trustAfter})`);
  const f1 = report("report_filed", t1.includes("report_filed"));
  const f2 = report(`trust_changed (${trustAfter} < 3, so the score moved)`, t1.includes("trust_changed"));
  console.log(`   types present: [${t1.join(", ")}]\n`);

  // --- 2. Trust changes again ----------------------------------------------
  // Reload: the in-memory copy is stale (it still holds the pre-report score),
  // and passing that to the service would make it report a change that never
  // happened.
  const fresh = await Pulse.findById(pulse._id);
  const beforeSecond = fresh.trustScore;
  await Notification.deleteMany({ user: provider._id });

  // Trust only moves on thresholds, and a high-severity report is worth -0.5
  // at 1 and at 3. There is one high report so far, so two more are needed to
  // actually cross the second threshold. The rate limit is per reporter per day,
  // so each needs its own throwaway account — which also proves the unique
  // index is enforced.
  const extras = [];
  for (let i = 0; i < 2; i += 1) {
    const u = await User.create({
      phone: `+23480${Date.now().toString().slice(-8)}${i}`,
      email: `audit-${Date.now()}-${i}@example.com`,
      name: `Audit Temp Reporter ${i}`,
      roles: ["customer"],
    });
    extras.push(u);
    await Report.create({
      pulse: pulse._id,
      reporter: u._id,
      reason: "unsafe_or_dishonest",
      note: "Additional complaint.",
      severity: "high",
      reportDay: new Date().toISOString().slice(0, 10),
    });
  }

  const { recalculateTrustForPulse } = require("../src/services/trustScoreService");
  const newScore = await recalculateTrustForPulse(fresh);
  const t2 = await typesFor(provider._id);
  console.log(`2. Trust recalculated again (${beforeSecond} -> ${newScore})`);
  report(
    `trust_changed on a further drop (${newScore} < ${beforeSecond})`,
    newScore < beforeSecond && t2.includes("trust_changed"),
  );
  console.log(`   types present: [${t2.join(", ")}]\n`);

  // --- 3. Status about to lapse --------------------------------------------
  await Notification.deleteMany({ user: provider._id });
  // Backdate so the listing is inside the warning window, then run the rule.
  pulse.status = "Available";
  pulse.lastUpdated = new Date(Date.now() - 2.6 * 60 * 60 * 1000);
  await pulse.save();
  await applyFreshnessRule();
  const t3 = await typesFor(provider._id);
  console.log("3. Status about to lapse (2.6h old, inside the 3h window)");
  report("listing_lapsed warning", t3.includes("listing_lapsed"));
  console.log(`   types present: [${t3.join(", ")}]\n`);

  // --- 4. Status has lapsed -------------------------------------------------
  await Notification.deleteMany({ user: provider._id });
  pulse.status = "Available";
  pulse.lastUpdated = new Date(Date.now() - 4 * 60 * 60 * 1000);
  await pulse.save();
  await applyFreshnessRule();
  const lapsedStatus = (await Pulse.findById(pulse._id)).status;
  const t4 = await typesFor(provider._id);
  console.log(`4. Status lapsed (4h old -> now "${lapsedStatus}")`);
  report("listing_lapsed_final confirmation", t4.includes("listing_lapsed_final"));
  console.log(`   types present: [${t4.join(", ")}]\n`);

  // --- 5. Status just updated by the provider -------------------------------
  await Notification.deleteMany({ user: provider._id });
  const r5 = await api(`/pulses/${pulse._id}/status`, {
    method: "PATCH",
    token: providerToken,
    body: { status: "Available" },
  });
  const t5 = await typesFor(provider._id);
  console.log(`5. Provider updates status (PATCH -> ${r5.status})`);
  report("status_updated confirmation", t5.includes("status_updated"));
  console.log(`   types present: [${t5.join(", ")}]\n`);

  // --- 6. Re-confirming the SAME status must stay silent ---------------------
  // The noise guard: confirming the status you already have is the single most
  // likely action in the app, and the dashboard already shows the result.
  await Notification.deleteMany({ user: provider._id });
  const r6 = await api(`/pulses/${pulse._id}/status`, {
    method: "PATCH",
    token: providerToken,
    body: { status: "Available" },
  });
  const t6 = await typesFor(provider._id);
  console.log(`6. Provider re-confirms the same status (PATCH -> ${r6.status})`);
  report(
    `status_updated NOT repeated (${t6.length} notification(s))`,
    t6.length === 0,
  );
  console.log(`   types present: [${t6.join(", ")}]\n`);

  // --- Summary --------------------------------------------------------------
  const all = await Notification.find({}).distinct("type");
  console.log(`Notification types that exist in the database so far: [${all.join(", ")}]`);
  const { NOTIFICATION_TYPES } = require("../src/models/notification.model");
  console.log(`Types defined in the enum: [${NOTIFICATION_TYPES.join(", ")}]`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
