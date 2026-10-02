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

const put = (id, token, body) =>
  fetch(`${BASE}/pulses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

(async () => {
  await connectDB();

  const provider = await User.findOne({ roles: "agent" });
  if (!provider) throw new Error("No provider with an existing listing to test against");

  const existing = await Pulse.findOne({ agent: provider._id });
  if (!existing) throw new Error("No existing listing to test against");

  const token = tokenFor(provider);
  const pulseId = existing._id;

  // Snapshot the fields this script touches so the provider's real data is put
  // back exactly as it was, whether the run passes or fails.
  const before = existing.toObject();

  console.log(`\nListing "${before.title}" (${pulseId})`);
  console.log("Locked fields: title, location, address, category, coordinates\n");

  // A benign editable change, to prove the endpoint still accepts real edits and
  // that the guard is not simply rejecting every PUT.
  console.log("Editable fields still save:");
  const probe = before.description === "verify-immutable-probe"
    ? "verify-immutable-probe-2"
    : "verify-immutable-probe";

  const editableRes = await put(pulseId, token, { description: probe });
  const editableBody = await editableRes.json();
  check("description saves", editableRes.status === 200, `got ${editableRes.status}`);
  check(
    "description actually persisted",
    editableBody?.data?.description === probe,
    JSON.stringify(editableBody?.data?.description),
  );
  check(
    "contactPhone still saves",
    (await put(pulseId, token, { contactPhone: before.contactPhone || "08030000000" })).status === 200,
  );

  // Each locked field, sent alone, must be refused with a legible code.
  console.log("\nLocked fields are refused:");
  const attempts = [
    ["title", { title: "Renamed Business" }],
    ["location", { location: "Yaba" }],
    ["address", { address: "42 Some Other Street" }],
    ["category", { category: before.category === "gas" ? "food" : "gas" }],
    // Coordinates are reported under the two fields a client actually sends.
    ["coordinates", { latitude: 6.5, longitude: 3.35 }, ["latitude", "longitude"]],
  ];

  for (const [label, body, named] of attempts) {
    const res = await put(pulseId, token, body);
    const payload = await res.json().catch(() => null);
    const expectedFields = named || [label];
    check(
      `${label} is rejected`,
      res.status === 400,
      `got ${res.status}`,
    );
    check(
      `${label} rejection carries code LISTING_FIELDS_IMMUTABLE`,
      payload?.code === "LISTING_FIELDS_IMMUTABLE",
      JSON.stringify(payload?.code),
    );
    check(
      `${label} rejection names the field`,
      Array.isArray(payload?.fields) && expectedFields.every((f) => payload.fields.includes(f)),
      JSON.stringify(payload?.fields),
    );
  }

  // Empty and null values must be refused too. A guard written as a truthiness
  // check would let `title: ""` or `title: null` through and blank the listing.
  console.log("\nEmpty and null attempts are refused:");
  for (const [label, value] of [["empty string", ""], ["null", null]]) {
    const res = await put(pulseId, token, { title: value });
    check(
      `title as ${label} is rejected`,
      res.status === 400,
      `got ${res.status}`,
    );
  }

  // A refusal must be total: if the guard ran after some fields were assigned, a
  // rejected write would still have half-applied.
  console.log("\nRejected writes do not partially apply:");
  const after = await Pulse.findById(pulseId).lean();
  check("title unchanged", after.title === before.title, `${after.title}`);
  check("location unchanged", after.location === before.location, `${after.location}`);
  check("address unchanged", after.address === before.address, `${after.address}`);
  check("category unchanged", after.category === before.category, `${after.category}`);
  check(
    "coordinates unchanged",
    JSON.stringify(after.coordinates) === JSON.stringify(before.coordinates),
  );

  // Several locked fields at once should report all of them, so a client that
  // sends them together gets one complete answer.
  console.log("\nMultiple locked fields are reported together:");
  const multiRes = await put(pulseId, token, { title: "X", location: "Y", address: "Z" });
  const multiBody = await multiRes.json().catch(() => null);
  check("rejected", multiRes.status === 400, `got ${multiRes.status}`);
  check(
    "reports all three fields",
    Array.isArray(multiBody?.fields) &&
      multiBody.fields.includes("title") &&
      multiBody.fields.includes("location") &&
      multiBody.fields.includes("address"),
    JSON.stringify(multiBody?.fields),
  );
  check(
    "message is human-readable",
    typeof multiBody?.message === "string" && multiBody.message.includes("business name"),
    JSON.stringify(multiBody?.message),
  );

  // A mixed write (one editable + one locked) must still be refused outright, so
  // a locked field cannot be smuggled through alongside a legitimate edit.
  // The description sent here differs from the one already stored, so the final
  // readback can distinguish "the rejected write applied nothing" from "the
  // value happens to already equal what was sent".
  console.log("\nMixed editable + locked writes are refused:");
  const smuggled = `${probe}-smuggled`;
  const mixedRes = await put(pulseId, token, { description: smuggled, location: "Ikeja" });
  const mixedBody = await mixedRes.json().catch(() => null);
  check("rejected", mixedRes.status === 400, `got ${mixedRes.status}`);
  const afterMixed = await Pulse.findById(pulseId).lean();
  check(
    "the editable field in a rejected write did not persist either",
    afterMixed.description === probe,
    `expected "${probe}", got "${afterMixed.description}"`,
  );

  // Restore. Locked fields are written straight to the document because the API
  // is the thing under test and deliberately refuses to write them.
  await Pulse.findByIdAndUpdate(
    pulseId,
    {
      $set: {
        title: before.title,
        description: before.description,
        contactPhone: before.contactPhone,
        email: before.email,
        whatsapp: before.whatsapp,
        address: before.address,
        location: before.location,
        category: before.category,
        details: before.details,
        images: before.images,
        coordinates: before.coordinates,
      },
    },
    { new: true },
  );
  console.log("\nListing restored to its original state.");

  await mongoose.disconnect();

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
