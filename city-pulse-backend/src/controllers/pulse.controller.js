const Pulse = require("../models/pulse.model");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all pulses
// @route   GET /api/v1/pulses
exports.getPulses = asyncHandler(async (req, res) => {
  const pulses = await Pulse.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: pulses.length, data: pulses });
});

// @desc    Get single pulse
// @route   GET /api/v1/pulses/:id
exports.getPulseById = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);

  if (!pulse) {
    return res.status(404).json({ success: false, message: "Pulse not found" });
  }

  res.status(200).json({ success: true, data: pulse });
});

// @desc    Create a pulse
// @route   POST /api/v1/pulses
exports.createPulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.create(req.body);
  res.status(201).json({ success: true, data: pulse });
});

// @desc    Update a pulse
// @route   PUT /api/v1/pulses/:id
exports.updatePulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!pulse) {
    return res.status(404).json({ success: false, message: "Pulse not found" });
  }

  res.status(200).json({ success: true, data: pulse });
});

// @desc    Delete a pulse
// @route   DELETE /api/v1/pulses/:id
exports.deletePulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findByIdAndDelete(req.params.id);

  if (!pulse) {
    return res.status(404).json({ success: false, message: "Pulse not found" });
  }

  res.status(200).json({ success: true, data: {} });
});
