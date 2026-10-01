require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");
const Notification = require("../src/models/notification.model");
const { applyFreshnessRule, FRESHNESS_WINDOW_MS, LAPSE_WARNING_MS } = require("../src/services/freshnessService");

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

(async () => {
  await connectDB();

  const pulse = await Pulse.findOne({});
  const provider = await User.findById(pulse.agent);
  const now = Date.now();

  console.log(`\nFreshness window: ${FRESHNESS_WINDOW_MS / HOUR}h`);
  console.log(`Warning opens:   last ${(FRESHNESS_WINDOW_MS - LAPSE_WARNING_MS) / MIN} minutes of the window\n`);

  const cases = [
    { label: "1 min old (comfortably fresh)", age: now - 1 * MIN },
    { label: "2h old (outside warning)", age: now - 2 * HOUR },
    { label: "2h31m old (warning just opened)", age: now - 2.51 * HOUR },
    { label: "2h55m old (deep in warning)", age: now - 2.92 * HOUR },
    { label: "3h05m old (just lapsed)", age: now - 3.08 * HOUR },
    { label: "10h old (long lapsed)", age: now - 10 * HOUR },
  ];

  let failures = 0;

  for (const c of cases) {
    await Notification.deleteMany({ user: provider._id });

    // Reloaded every iteration on purpose. `applyFreshnessRule` writes the
    // status with a bulk `updateMany`, which bypasses this document, so a
    // reused in-memory copy silently disagrees with the database — and because
    // Mongoose only persists *modified* paths, re-assigning a field the stale
    // document already holds is a no-op that leaves the old value in place.
    const fresh = await Pulse.findById(pulse._id);
    fresh.status = "Available";
    fresh.lastUpdated = new Date(c.age);
    await fresh.save();

    await applyFreshnessRule();

    const types = (await Notification.find({ user: provider._id }).lean()).map((n) => n.type);
    const after = (await Pulse.findById(pulse._id)).status;

    const warned = types.includes("listing_lapsed");
    const lapsedNotified = types.includes("listing_lapsed_final");

    // Expected behaviour, derived from the thresholds rather than hard-coded.
    const remaining = FRESHNESS_WINDOW_MS - (now - c.age);
    const shouldWarn = remaining > 0 && remaining <= LAPSE_WARNING_MS;
    const shouldLapse = remaining <= 0;

    const ok = warned === shouldWarn && lapsedNotified === shouldLapse;
    if (!ok) failures += 1;

    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${c.label.padEnd(36)} warn=${String(warned).padEnd(5)} ` +
        `lapsed=${String(lapsedNotified).padEnd(5)} status="${after}"`,
    );
  }

  // An already-Unconfirmed listing must never be warned about or re-lapsed.
  await Notification.deleteMany({ user: provider._id });
  const noop = await Pulse.findById(pulse._id);
  noop.status = "Unconfirmed";
  noop.lastUpdated = new Date(now - 10 * HOUR);
  await noop.save();
  await applyFreshnessRule();
  const noopCount = (await Notification.find({ user: provider._id }).lean()).length;
  const noopOk = noopCount === 0;
  if (!noopOk) failures += 1;
  console.log(`  ${noopOk ? "PASS" : "FAIL"}  already Unconfirmed, 10h old              notifications=${noopCount} (expect 0)`);

  // Restore.
  const restore = await Pulse.findById(pulse._id);
  restore.status = "Available";
  restore.trustScore = 3;
  restore.lastUpdated = new Date();
  await restore.save();
  await User.findByIdAndUpdate(provider._id, { trustScore: 3 });
  await Notification.deleteMany({ user: provider._id });

  console.log(`\n${failures === 0 ? "All boundary cases pass." : `${failures} FAILURE(S).`}\n`);

  await mongoose.disconnect();
  if (failures > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
