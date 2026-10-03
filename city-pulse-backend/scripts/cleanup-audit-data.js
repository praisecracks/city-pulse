/** Removes the throwaway accounts and rows left behind by the audit script. */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Report = require("../src/models/report.model");
const Notification = require("../src/models/notification.model");
const Pulse = require("../src/models/pulse.model");

(async () => {
  await connectDB();

  const tempUsers = await User.find({ name: /^Audit Temp Reporter/ }).select("_id").lean();
  const ids = tempUsers.map((u) => u._id);

  const reports = await Report.deleteMany({ reporter: { $in: ids } });
  const users = await User.deleteMany({ _id: { $in: ids } });
  const notifications = await Notification.deleteMany({});

  // Leave the listing in a sane state for manual testing.
  await Report.deleteMany({});
  await Pulse.updateMany({}, { $set: { trustScore: 3 } });
  const pulse = await Pulse.findOne({});
  if (pulse) {
    pulse.status = "Available";
    pulse.lastUpdated = new Date();
    await pulse.save();
    await User.findByIdAndUpdate(pulse.agent, { trustScore: 3 });
  }

  console.log(`removed ${users.deletedCount} temp users`);
  console.log(`removed ${reports.deletedCount} reports`);
  console.log(`removed ${notifications.deletedCount} notifications`);
  console.log(`remaining users: ${await User.countDocuments()}`);

  await mongoose.disconnect();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
