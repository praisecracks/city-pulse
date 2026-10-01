require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");
const Notification = require("../src/models/notification.model");
const Report = require("../src/models/report.model");
const { applyFreshnessRule } = require("../src/services/freshnessService");
const { recalculateTrustForPulse } = require("../src/services/trustScoreService");

const HOUR = 60 * 60 * 1000;

(async () => {
  await connectDB();

  const pulse = await Pulse.findOne({});
  const provider = await User.findById(pulse.agent);
  const reporter = await User.findOne({ _id: { $ne: pulse.agent } });

  await Notification.deleteMany({ user: provider._id });
  await Report.deleteMany({});
  pulse.status = "Available";
  pulse.trustScore = 3;
  pulse.lastUpdated = new Date();
  await pulse.save();
  await User.findByIdAndUpdate(provider._id, { trustScore: 3 });

  // 1. A report, which also moves trust.
  await Report.create({
    pulse: pulse._id,
    reporter: reporter._id,
    reason: "unsafe_or_dishonest",
    note: "Took 2000 and never delivered.",
    severity: "high",
    reportDay: new Date().toISOString().slice(0, 10),
  });
  await recalculateTrustForPulse(pulse);

  // 2. A genuine status change.
  pulse.status = "Low Supply";
  await pulse.save();
  const { notifyStatusUpdated } = require("../src/services/notificationService");
  await notifyStatusUpdated({ pulse, from: "Available", to: "Low Supply" });

  // 3. A listing about to lapse.
  pulse.status = "Available";
  pulse.lastUpdated = new Date(Date.now() - 2.7 * HOUR);
  await pulse.save();
  await applyFreshnessRule();

  // 4. A listing that has lapsed.
  pulse.status = "Available";
  pulse.lastUpdated = new Date(Date.now() - 4 * HOUR);
  await pulse.save();
  await applyFreshnessRule();

  const rows = await Notification.find({ user: provider._id }).sort({ createdAt: 1 }).lean();

  console.log(`\nWhat "${provider.name}" sees in the Alerts tab:\n`);
  for (const n of rows) {
    console.log(`  [${n.type}]`);
    console.log(`    title: ${n.title}`);
    console.log(`    body:  ${n.body}`);
    console.log(`    go to: ${n.action}`);
    console.log("");
  }
  console.log(`Total: ${rows.length} notifications\n`);

  await Notification.deleteMany({ user: provider._id });
  await Report.deleteMany({});
  pulse.status = "Available";
  pulse.trustScore = 3;
  pulse.lastUpdated = new Date();
  await pulse.save();
  await User.findByIdAndUpdate(provider._id, { trustScore: 3 });

  await mongoose.disconnect();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
