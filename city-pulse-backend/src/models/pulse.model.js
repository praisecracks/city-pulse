const mongoose = require("mongoose");

// A "Pulse" represents a single live post about something happening nearby
// (e.g. "Suya spot open till late on Ake Road"). This is a starter model —
// adjust fields once the real data requirements are defined.
const pulseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A pulse needs a title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "A pulse needs a location"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pulse", pulseSchema);
