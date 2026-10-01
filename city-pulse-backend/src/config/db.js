const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in your .env file");
  }

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Give buffered operations more headroom on flaky networks so a
    // temporary MongoDB Atlas blip doesn't cascade into 401 "Invalid token".
    bufferTimeoutMS: 30000,
  });
  console.log("✅ MongoDB connected");

  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
};

module.exports = connectDB;
