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
    /**
     * An address offered by a later sign-up but not yet proven.
     *
     * `email` is only ever written from a verified request. Knowing someone's
     * phone number is not proof they own an address, so an address arriving on
     * /auth/send-otp is parked here and moved into `email` by verifyOtp once
     * the code has been proven. Writing it immediately let anyone who knew a
     * phone number permanently re-point that account's address, which also
     * freed the old address for someone else to claim.
     */
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    /**
     * True while `email` is a generated stand-in rather than an address the
     * person supplied.
     *
     * It gates the one legitimate case for adopting a new address: the person
     * signed up with a phone only, and a later sign-up supplies their real one.
     * An account that already has a real address is never overwritten, so a
     * shared placeholder sent by the phone-only sign-in screen cannot clobber
     * it.
     */
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
