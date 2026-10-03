const UserWaitlist = require("../models/userWaitlist.model");
const AgentWaitlist = require("../models/agentWaitlist.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Join the user waitlist
 * @route   POST /api/v1/waitlist/user
 * @access  Public
 */
exports.joinUserWaitlist = asyncHandler(async (req, res) => {
    const { fullName, phone, neighborhood, preferences } = req.body;

    const existing = await UserWaitlist.findOne({ phone });
    if (existing) {
        return res.status(409).json({ success: false, message: "This phone number is already on the waitlist" });
    }

    const entry = await UserWaitlist.create({ fullName, phone, neighborhood, preferences });
    res.status(201).json({ success: true, data: entry });
});

/**
 * @desc    Join the agent/merchant waitlist
 * @route   POST /api/v1/waitlist/agent
 * @access  Public
 */
exports.joinAgentWaitlist = asyncHandler(async (req, res) => {
    const { businessName, serviceType, phone } = req.body;

    const existing = await AgentWaitlist.findOne({ phone });
    if (existing) {
        return res.status(409).json({ success: false, message: "This phone number is already on the waitlist" });
    }

    const entry = await AgentWaitlist.create({ businessName, serviceType, phone });
    res.status(201).json({ success: true, data: entry });
});

/**
 * @desc    View all user waitlist entries
 * @route   GET /api/v1/waitlist/user
 * @access  Public (tighten this later once an admin area exists)
 */
exports.getUserWaitlist = asyncHandler(async (req, res) => {
    const entries = await UserWaitlist.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: entries.length, data: entries });
});

/**
 * @desc    View all agent waitlist entries
 * @route   GET /api/v1/waitlist/agent
 * @access  Public (tighten this later once an admin area exists)
 */
exports.getAgentWaitlist = asyncHandler(async (req, res) => {
    const entries = await AgentWaitlist.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: entries.length, data: entries });
});