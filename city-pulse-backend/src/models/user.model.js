const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Retained for compatibility with older OTP-based account records.
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    // Retained for compatibility with older phone-only account records.
    emailIsPlaceholder: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: undefined,
      match: [/^\/uploads\/[A-Za-z0-9._-]+$/, "Avatar must be an uploaded image path"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    // Platform/admin review, not proof of phone ownership or an OTP.
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, trim: true },
    verificationNote: { type: String, trim: true, maxlength: 500 },
    // Legacy OTP state; account review status is tracked separately by isVerified.
    otpVerified: {
      type: Boolean,
      default: false,
    },
    otp: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    roles: {
      type: [String],
      default: ["customer"],
      enum: ["customer", "agent"],
    },
    // Records that the person chose "Service Provider" at sign-up. This is
    // intent, NOT completion: the "agent" role is only granted once they have
    // actually published a listing (see createPulse). Keeping the two apart is
    // what lets the app tell an in-progress applicant apart from a real
    // provider, so a reload mid-onboarding cannot drop them onto the agent
    // dashboard with an empty profile.
    agentIntent: {
      type: Boolean,
      default: false,
    },
    trustScore: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    /**
     * Listing ids this account has saved, most recently added last.
     *
     * Saved as ids rather than a subdocument because a favourite is only ever
     * rendered by resolving it against the live listing set — a saved listing
     * that has been unpublished must stop appearing, which it does automatically
     * when resolution fails.
     */
    favorites: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pulse' }],
      default: [],
    },
    badges: {
      type: [String],
      default: [],
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    // Business profile visibility: 'public' or 'private'
    // When private, the business profile is hidden from other users
    businessProfileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  { timestamps: true },
);

// TTL index for OTP expiry cleanup
userSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);
