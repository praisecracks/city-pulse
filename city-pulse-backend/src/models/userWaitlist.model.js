const mongoose = require("mongoose");

const userWaitlistSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone is required"],
            unique: true,
            trim: true,
        },
        neighborhood: {
            type: String,
            required: [true, "Neighborhood is required"],
            enum: ["panseke", "ibara", "camp", "adigbe", "kuto", "other"],
        },
        preferences: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("UserWaitlist", userWaitlistSchema);