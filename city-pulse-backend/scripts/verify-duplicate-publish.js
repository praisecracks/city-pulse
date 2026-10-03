require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { JWT_SECRET, JWT_EXPIRES_IN } = require("../src/config/jwt");
const connectDB = require("../src/config/db");
const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");

const BASE = "http://localhost:5000/api/v1";

const tokenFor = (u) =>
  jwt.sign({ userId: u._id, phone: u.phone, roles: u.roles }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

(async () => {
  await connectDB();

  const provider = await User.findOne({ roles: "agent" });
  if (!provider) throw new Error("No provider with an existing listing to test against");

  const count = await Pulse.countDocuments({ agent: provider._id });
  const token = tokenFor(provider);

  console.log(`\nProvider ${provider.name} already has ${count} listing(s).`);
  console.log("Attempting a second publish:\n");

  const existing = await Pulse.findOne({ agent: provider._id });
  if (!existing) throw new Error("No existing listing to clone a valid payload from");

  // Cloned from the provider's real listing so validation passes and the request
  // actually reaches the unique index. An invalid body is rejected earlier with a
  // 400, which would prove nothing about the duplicate path.
  const payloadBody = JSON.parse(JSON.stringify(existing.toObject()));
  delete payloadBody._id;
  delete payloadBody.__v;
  payloadBody.title = "A Second Listing That Must Not Exist";

  const res = await fetch(`${BASE}/pulses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payloadBody),
  });
  const body = await res.json();

  check("responds 409 Conflict", res.status === 409, `got ${res.status}`);
  check(
    "carries `roles` so the client can stop treating this as an applicant",
    Array.isArray(body.roles) && body.roles.includes("agent"),
    JSON.stringify(body.roles),
  );
  check(
    "carries a stable `code`, not only prose",
    body.code === "LISTING_ALREADY_EXISTS",
    body.code,
  );
  check("still no duplicate listing was created", (await Pulse.countDocuments({ agent: provider._id })) === count);

  console.log(`\n  message: ${body.message}\n`);

  await mongoose.disconnect();
  console.log(failures === 0 ? "409 is recoverable.\n" : `${failures} FAILURE(S).\n`);
  if (failures > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});