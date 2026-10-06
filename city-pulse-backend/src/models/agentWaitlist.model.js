const mongoose = require("mongoose");

const agentWaitlistSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: [true, "Business name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        serviceType: {
            type: String,
            required: [true, "Service type is required"],
            enum: [
                "POS / Cash Withdrawal",
                "Food Vendors / Restaurants",
                "Gas Refill",
                "House Agents / Property",
            ],
        },
        phone: {
            type: String,
            required: [true, "Phone is required"],
            unique: true,
            trim: true,
        },
        whatsappPhone: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("AgentWaitlist", agentWaitlistSchema);