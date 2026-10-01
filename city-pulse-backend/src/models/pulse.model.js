const mongoose = require("mongoose");

// A listing represents a provider's business entry on City Pulse
// (e.g. a POS agent, food vendor, gas refill point, house agent).
const pulseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A listing needs a title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, "A listing needs a location"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    status: {
      type: String,
      enum: ["Available", "Low Supply", "Unavailable", "Unconfirmed"],
      default: "Unconfirmed",
    },
    trustScore: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracy: { type: Number },
      source: { type: String, enum: ["gps", "manual"], default: "manual" },
    },
    // The listing's human-readable location ("Ibara, Abeokuta"). Stored once as
    // `location` rather than split into community/neighborhood/city/state/
    // country: those five fields were accepted by the API but never written by
    // any client and never read by any client, so they were a place to put
    // address data that would then silently not appear anywhere. Exact
    // coordinates live in `coordinates` for distance maths.
    //
    // If structured location filtering is ever needed, add the fields the
    // clients actually send and read in the same change — not speculatively.
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "A listing needs category-specific details"],
    },
    // Photos the provider uploaded during onboarding. The first entry is the
    // cover shot shown on cards; the rest form the gallery on the listing page.
    // `path` is host-independent (e.g. "/uploads/ab12.jpg") so a listing keeps
    // working if the API moves behind a different domain or a CDN.
    images: {
      type: [
        {
          _id: false,
          path: {
            type: String,
            required: [true, "A photo needs a path"],
            trim: true,
          },
          caption: {
            type: String,
            trim: true,
            maxlength: [120, "A photo caption can be at most 120 characters"],
            default: "",
          },
          isCover: {
            type: Boolean,
            default: false,
          },
        },
      ],
      validate: {
        validator: (images) => images.length <= 4,
        message: "A listing can have at most 4 photos",
      },
      default: [],
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// One active listing per provider. Without this, nothing stops the same account
// publishing twice — which is exactly what happens if the app dies between
// creating a listing and recording the new role locally. It is also the index
// that makes the "my listings" lookup a seek instead of a collection scan.
//
// If this index ever fails to build because legacy duplicates exist, resolve
// them first (keep the newest per agent) rather than dropping the constraint.
pulseSchema.index({ agent: 1 }, { unique: true });

module.exports = mongoose.model("Pulse", pulseSchema);

