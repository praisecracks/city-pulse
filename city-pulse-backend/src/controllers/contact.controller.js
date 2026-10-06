const Contact = require("../models/contact.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Submit a contact form message
 * @route   POST /api/v1/contact
 * @access  Public
 */
exports.submitContact = asyncHandler(async (req, res) => {
    const { name, email, phone, whatsapp, area, message } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({
            success: false,
            message: "Name, email, phone, and message are required",
        });
    }

    const entry = await Contact.create({ name, email, phone, whatsapp, area, message });
    res.status(201).json({ success: true, data: entry });
});

/**
 * @desc    View all contact messages
 * @route   GET /api/v1/contact
 * @access  Public (tighten this later once an admin area exists)
 */
exports.getContacts = asyncHandler(async (req, res) => {
    const entries = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: entries.length, data: entries });
});

/**
 * @desc    Update contact message status
 * @route   PATCH /api/v1/contact/:id
 * @access  Public (tighten later)
 */
exports.updateContactStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const entry = await Contact.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    );
    if (!entry) {
        return res.status(404).json({ success: false, message: "Contact not found" });
    }
    res.status(200).json({ success: true, data: entry });
});