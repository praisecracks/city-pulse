// Smoke test. Creates and deletes throwaway rows, so point MONGO_URI at a
// scratch database — never at production data.
require("dotenv").config({ path: __dirname + "/../.env" });

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../src/models/user.model");
const Pulse = require("../src/models/pulse.model");
const pulseRoutes = require("../src/routes/pulse.routes");
const { JWT_SECRET } = require("../src/config/jwt");

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    console.log("  FAIL  " + name + (extra ? "  -> " + JSON.stringify(extra) : ""));
  }
}

const stamp = Date.now();
const PHONE_A = "+23480" + String(10000000 + (stamp % 89999999)).slice(0, 8);
const PHONE_B = "+23480" + String(10000000 + ((stamp + 7) % 89999999)).slice(0, 8);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const server = app().listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;

  const userA = await User.create({ name: "Smoke A", email: "smoke.a." + stamp + "@example.com", phone: PHONE_A, otpVerified: true, roles: ["customer"] });
  const userB = await User.create({ name: "Smoke B", email: "smoke.b." + stamp + "@example.com", phone: PHONE_B, otpVerified: true, roles: ["customer"] });
  const tokA = jwt.sign({ userId: String(userA._id) }, JWT_SECRET);
  const tokB = jwt.sign({ userId: String(userB._id) }, JWT_SECRET);

  const call = (path, opts = {}) =>
    fetch(base + path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

  const listing = {
    title: "Smoke Test Market",
    description: "A temporary listing created by the verification script.",
    location: "Smoke Test Area",
    category: "pos",
    details: { feePer5000: 100, acceptedCardBrands: ["Visa", "Verve"] },
  };

  console.log("\n[1] create listing");
  const created = await call("/pulses", { method: "POST", headers: { Authorization: "Bearer " + tokA }, body: JSON.stringify(listing) });
  check("create returns 201", created.status === 201, created.body);
  check("create grants agent role", created.body && created.body.roles && created.body.roles.includes("agent"), created.body && created.body.roles);
  const id = created.body && created.body.data && created.body.data._id;

  console.log("\n[2] GET /pulses/mine route ordering");
  const mineA = await call("/pulses/mine", { headers: { Authorization: "Bearer " + tokA } });
  check("mine returns 200 (not swallowed by /:id)", mineA.status === 200, mineA.body);
  check("mine is an array with 1 listing", Array.isArray(mineA.body && mineA.body.data) && mineA.body.data.length === 1, mineA.body && mineA.body.data && mineA.body.data.length);
  check("mine returns the created id", mineA.body && mineA.body.data && mineA.body.data[0] && mineA.body.data[0]._id === id, { got: mineA.body && mineA.body.data && mineA.body.data[0] && mineA.body.data[0]._id, want: id });
  check("mine requires auth", (await call("/pulses/mine")).status === 401);
  const mineB = await call("/pulses/mine", { headers: { Authorization: "Bearer " + tokB } });
  check("other provider sees empty list", mineB.status === 200 && mineB.body.data.length === 0, mineB.body);

  console.log("\n[3] one listing per provider");
  const dupe = await call("/pulses", { method: "POST", headers: { Authorization: "Bearer " + tokA }, body: JSON.stringify(listing) });
  check("second publish returns 409 not 500", dupe.status === 409, dupe);
  const stillOne = await call("/pulses/mine", { headers: { Authorization: "Bearer " + tokA } });
  check("still exactly 1 listing after duplicate attempt", stillOne.body.data.length === 1, stillOne.body.data.length);

  console.log("\n[4] PATCH /pulses/:id/status");
  const before = stillOne.body.data[0].lastUpdated;
  const bad = await call("/pulses/" + id + "/status", { method: "PATCH", headers: { Authorization: "Bearer " + tokA }, body: JSON.stringify({ status: "Bogus" }) });
  check("invalid status returns 400", bad.status === 400, bad);
  const wrongOwner = await call("/pulses/" + id + "/status", { method: "PATCH", headers: { Authorization: "Bearer " + tokB }, body: JSON.stringify({ status: "Available" }) });
  check("non-owner status change returns 403", wrongOwner.status === 403, wrongOwner);
  await new Promise((r) => setTimeout(r, 15));
  const good = await call("/pulses/" + id + "/status", { method: "PATCH", headers: { Authorization: "Bearer " + tokA }, body: JSON.stringify({ status: "Available" }) });
  check("valid status returns 200", good.status === 200, good);
  check("status persisted", good.body && good.body.data && good.body.data.status === "Available", good.body && good.body.data);
  check("lastUpdated bumped", good.body && good.body.data && new Date(good.body.data.lastUpdated) > new Date(before), { before, after: good.body && good.body.data && good.body.data.lastUpdated });
  const noAuth = await call("/pulses/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status: "Available" }) });
  check("status change requires auth", noAuth.status === 401, noAuth);

  console.log("\n[5] status is not writable through the generic route");
  const viaPut = await call("/pulses/" + id, { method: "PUT", headers: { Authorization: "Bearer " + tokA }, body: JSON.stringify({ status: "Unavailable" }) });
  check("PUT does not accept status", viaPut.status === 200 && viaPut.body.data.status === "Available", viaPut.body && viaPut.body.data && viaPut.body.data.status);

  console.log("\n[6] cleanup");
  await Pulse.deleteMany({ agent: { $in: [userA._id, userB._id] } });
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  const left = { pulses: await Pulse.countDocuments({ agent: { $in: [userA._id, userB._id] } }), users: await User.countDocuments({ _id: { $in: [userA._id, userB._id] } }) };
  check("fixtures removed", left.pulses === 0 && left.users === 0, left);

  server.close();
  await mongoose.disconnect();
  console.log("\n" + pass + " passed, " + fail + " failed\n");
  process.exit(fail ? 1 : 0);
}

function app() {
  const a = express();
  a.use(express.json());
  a.use("/pulses", pulseRoutes);
  a.use((err, req, res, next) => { res.status(err.status || 500).json({ success: false, message: err.message }); });
  return a;
}

main().catch((e) => { console.error("CRASH:", e); process.exit(1); });
