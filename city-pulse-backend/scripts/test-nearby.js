const mongoose = require("mongoose");
const Pulse = require("../src/models/pulse.model");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri);

  // Test 1: With Unconfirmed included
  console.log("--- Test 1: Including Unconfirmed ---");
  const results1 = await Pulse.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [3.3340121, 7.1298637] },
        distanceField: "distanceMeters",
        maxDistance: 5000,
        spherical: true,
        query: { status: { $in: ["Available", "Low Supply", "Unavailable", "Unconfirmed"] } },
      },
    },
    { $limit: 10 },
    { $project: { title: 1, status: 1, distanceMeters: 1, coordinates: 1 } },
  ]);
  results1.forEach((r) => console.log("  -", r.title, "status:", r.status, "distance:", Math.round(r.distanceMeters), "m"));

  // Test 2: Default filter (Available, Low Supply, Unavailable)
  console.log("\n--- Test 2: Default filter (excludes Unconfirmed) ---");
  const results2 = await Pulse.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [3.3340121, 7.1298637] },
        distanceField: "distanceMeters",
        maxDistance: 5000,
        spherical: true,
        query: { status: { $in: ["Available", "Low Supply", "Unavailable"] } },
      },
    },
    { $limit: 10 },
    { $project: { title: 1, status: 1, distanceMeters: 1, coordinates: 1 } },
  ]);
  results2.forEach((r) => console.log("  -", r.title, "status:", r.status, "distance:", Math.round(r.distanceMeters), "m"));

  // Test 3: Category filter
  console.log("\n--- Test 3: Category filter (pos) ---");
  const results3 = await Pulse.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [3.3340121, 7.1298637] },
        distanceField: "distanceMeters",
        maxDistance: 5000,
        spherical: true,
        query: { status: { $in: ["Available", "Low Supply", "Unavailable", "Unconfirmed"] }, category: "pos" },
      },
    },
    { $limit: 10 },
    { $project: { title: 1, category: 1, status: 1, distanceMeters: 1 } },
  ]);
  results3.forEach((r) => console.log("  -", r.title, "cat:", r.category, "status:", r.status, "dist:", Math.round(r.distanceMeters), "m"));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});