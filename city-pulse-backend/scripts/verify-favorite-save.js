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

  // Any account can favourite; a customer (no agent role) is the realistic case.
  const user = await User.findOne({ roles: { $ne: "agent" } });
  if (!user) throw new Error("No customer account to test with");

  const pulse = await Pulse.findOne();
  if (!pulse) throw new Error("No listing to favourite");

  const token = tokenFor(user);
  const auth = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  console.log(`\nCustomer ${user.phone} favouriting listing ${pulse._id}\n`);

  // Start clean so the test is repeatable.
  await fetch(`${BASE}/auth/me/favorites/${pulse._id}`, { method: "DELETE", headers: auth });

  console.log("POST /auth/me/favorites with a JSON body (what the app now sends):");
  const addRes = await fetch(`${BASE}/auth/me/favorites`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ pulseId: String(pulse._id) }),
  });
  const addBody = await addRes.json();
  check("responds 200", addRes.status === 200, `got ${addRes.status}: ${addBody.message || ""}`);
  check(
    "returns the saved list containing the listing",
    Array.isArray(addBody.favorites) &&
      addBody.favorites.some((id) => String(id) === String(pulse._id)),
    JSON.stringify(addBody.favorites),
  );

  console.log("\nGET /auth/me/favorites reflects the save:");
  const getRes = await fetch(`${BASE}/auth/me/favorites`, { headers: auth });
  const getBody = await getRes.json();
  check(
    "listing is in the account's favourites",
    Array.isArray(getBody.favorites) &&
      getBody.favorites.some((id) => String(id) === String(pulse._id)),
    JSON.stringify(getBody.favorites),
  );

  console.log("\nControl — the same POST with NO body (the old, broken request):");
  const noBodyRes = await fetch(`${BASE}/auth/me/favorites`, {
    method: "POST",
    headers: auth,
  });
  const noBody = await noBodyRes.json();
  check(
    "is rejected, proving the body is required",
    noBodyRes.status === 404,
    `got ${noBodyRes.status}: ${noBody.message || ""}`,
  );

  // Restore: remove the test favourite so the account is left as found.
  await fetch(`${BASE}/auth/me/favorites/${pulse._id}`, { method: "DELETE", headers: auth });
  console.log("\nTest favourite removed; account restored.");

  await mongoose.disconnect();
  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
