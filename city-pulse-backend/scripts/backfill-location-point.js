#!/usr/bin/env node
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const Pulse = require("../src/models/pulse.model");

const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;

function isValidCoordinatePair(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= MIN_LAT && lat <= MAX_LAT &&
    lng >= MIN_LNG && lng <= MAX_LNG
  );
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in environment");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Phase 1: Detect ALL malformed locationPoint geometries
  console.log("\n--- Phase 1: Auditing existing locationPoint geometries ---");
  const malformed = await Pulse.collection.find({
    $or: [
      { "locationPoint.type": { $ne: "Point" } },
      { "locationPoint.coordinates": { $exists: true, $not: { $size: 2 } } },
      { "locationPoint.coordinates.0": { $not: { $type: "number" } } },
      { "locationPoint.coordinates.1": { $not: { $type: "number" } } },
      { "locationPoint.coordinates.0": { $in: [NaN, Infinity, -Infinity] } },
      { "locationPoint.coordinates.1": { $in: [NaN, Infinity, -Infinity] } },
      { "locationPoint.coordinates.0": { $lt: MIN_LNG } },
      { "locationPoint.coordinates.0": { $gt: MAX_LNG } },
      { "locationPoint.coordinates.1": { $lt: MIN_LAT } },
      { "locationPoint.coordinates.1": { $gt: MAX_LAT } },
      { "locationPoint.coordinates.0": { $type: "string" } },
      { "locationPoint.coordinates.1": { $type: "string" } },
    ],
  }).project({ _id: 1, locationPoint: 1, coordinates: 1 }).toArray();

  if (malformed.length > 0) {
    console.warn(`⚠️  Found ${malformed.length} documents with malformed locationPoint:`);
    for (const doc of malformed) {
      console.warn(`  - ${doc._id}:`, JSON.stringify(doc.locationPoint));
      const { latitude, longitude } = doc.coordinates || {};
      if (isValidCoordinatePair(latitude, longitude)) {
        await Pulse.updateOne(
          { _id: doc._id },
          { $set: { locationPoint: { type: "Point", coordinates: [longitude, latitude] } } }
        );
        console.log(`  ✓ Repaired from valid coordinates`);
      } else {
        await Pulse.updateOne({ _id: doc._id }, { $unset: { locationPoint: "" } });
        console.log(`  ✓ Removed invalid locationPoint (no valid coordinates to repair from)`);
      }
    }
  } else {
    console.log("✓ No malformed locationPoint geometries found");
  }

  // Phase 2: Backfill missing locationPoint from valid coordinates
  console.log("\n--- Phase 2: Backfilling missing locationPoint ---");
  const cursor = Pulse.collection.find({
    "coordinates.latitude": { $exists: true, $ne: null, $type: "number" },
    "coordinates.longitude": { $exists: true, $ne: null, $type: "number" },
    $or: [
      { locationPoint: { $exists: false } },
      { "locationPoint.coordinates": { $exists: false } },
    ],
  }).project({ _id: 1, coordinates: 1 });

  let backfilled = 0, skippedInvalid = 0;
  for await (const doc of cursor) {
    const { latitude, longitude } = doc.coordinates;
    if (isValidCoordinatePair(latitude, longitude)) {
      await Pulse.updateOne(
        { _id: doc._id },
        { $set: { locationPoint: { type: "Point", coordinates: [longitude, latitude] } } }
      );
      backfilled++;
    } else {
      skippedInvalid++;
    }
  }
  console.log(`✓ Backfilled locationPoint for ${backfilled} documents`);
  if (skippedInvalid) console.log(`ℹ️  Skipped ${skippedInvalid} documents with invalid coordinates`);

  // Phase 3: Final verification — zero malformed geometries remain
  console.log("\n--- Phase 3: Final verification ---");
  const remaining = await Pulse.collection.countDocuments({
    $or: [
      { "locationPoint.type": { $ne: "Point" } },
      { "locationPoint.coordinates": { $not: { $size: 2 } } },
      { "locationPoint.coordinates.0": { $not: { $type: "number" } } },
      { "locationPoint.coordinates.1": { $not: { $type: "number" } } },
      { "locationPoint.coordinates.0": { $lt: MIN_LNG } },
      { "locationPoint.coordinates.0": { $gt: MAX_LNG } },
      { "locationPoint.coordinates.1": { $lt: MIN_LAT } },
      { "locationPoint.coordinates.1": { $gt: MAX_LAT } },
    ],
  });

  if (remaining === 0) {
    console.log("✅ VERIFIED: Zero malformed locationPoint geometries remain. Safe to create 2dsphere index.");
  } else {
    console.error(`❌ FAILURE: ${remaining} malformed geometries still exist. Do NOT create index.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Phase 4: Report documents without coordinates (correctly excluded)
  console.log("\n--- Phase 4: Documents without valid coordinates ---");
  const noCoords = await Pulse.countDocuments({
    $or: [
      { "coordinates.latitude": { $exists: false } },
      { "coordinates.longitude": { $exists: false } },
      { $expr: { $not: [{ $and: [
        { $gte: ["$coordinates.latitude", MIN_LAT] }, { $lte: ["$coordinates.latitude", MAX_LAT] },
        { $gte: ["$coordinates.longitude", MIN_LNG] }, { $lte: ["$coordinates.longitude", MAX_LNG] }
      ] }] } },
    ],
  });
  console.log(`ℹ️  ${noCoords} documents have no valid coordinates — correctly excluded from geospatial queries`);

  await mongoose.disconnect();
  console.log("\nMigration complete. Now create 2dsphere index manually:");
  console.log("  db.pulses.createIndex({ locationPoint: '2dsphere' }, { sparse: true })");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});