const mongoose = require("mongoose");

const agentWaitlistSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: [true, "Business name is required"],
            trim: true,
        },
        serviceType: {
            type: String,
            required: [true, "Service type is required"],
            enum: [
                "POS Terminal Operator",
                "Cooking Gas Refill Station",
                "Food Vendor / Restaurant",
                "Verified Real Estate Agent",
            ],
        },
        phone: {
            type: String,
            required: [true, "Phone is required"],
            unique: true,
            trim: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("AgentWaitlist", agentWaitlistSchema);