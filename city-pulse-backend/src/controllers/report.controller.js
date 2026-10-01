const Report = require("../models/report.model");
const Pulse = require("../models/pulse.model");
const asyncHandler = require("../utils/asyncHandler");
const { recalculateTrustForPulse } = require("../services/trustScoreService");
const { notifyReportFiled } = require("../services/notificationService");

const { REPORT_REASONS, REASON_SEVERITY } = Report;

const MAX_NOTE_LENGTH = 280;

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// The only fields a client is ever allowed to see on a report. The reporter id
// is deliberately absent: PRD F8 and 15 require that reporter identity is never
// exposed to the reported agent on any client-facing surface. Admin tooling
// reads the model directly.
const REPORT_PUBLIC_FIELDS = "_id reason severity note createdAt";

/**
 * @desc    File a report against a listing
 * @route   POST /api/v1/pulses/:id/reports
 * @access  Private (customer)
 *
 * All enforced server-side; the client is not trusted to hold any of them:
 *   - the listing must exist
 *   - the reporter must not own the listing (no self-report)
 *   - one report per customer per listing per day (PRD F8)
 */
exports.createReport = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);
  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }

  // Self-report. An agent opening their own public listing must not be able to
  // file a report against themselves — that is the cheapest way to abuse the
  // trust system, and it is why this check lives here and not in the app.
  if (String(pulse.agent) === String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "You cannot report your own listing",
    });
  }

  const { reason, note } = req.body || {};

  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({
      success: false,
      message: `Reason must be one of: ${REPORT_REASONS.join(", ")}`,
    });
  }

  const report = await Report.create({
    pulse: pulse._id,
    reporter: req.user._id,
    reason,
    // Severity is derived here, never read from the body. A client must not be
    // able to declare its own report high-severity.
    severity: REASON_SEVERITY[reason],
    note: typeof note === "string" ? note.trim().slice(0, MAX_NOTE_LENGTH) : "",
    reportDay: utcDay(),
  });

  // A report is the only customer-originating input to trust, so the score is
  // recomputed immediately rather than waiting for some unrelated write. This
  // may also raise a trust_changed notification, if the score actually moved.
  const trustScore = await recalculateTrustForPulse(pulse);

  // Notify the provider. Done after the trust recalculation so the trust
  // notification (if any) lands before the report one — the score change is the
  // more important of the two, and the report explains it.
  await notifyReportFiled({ pulse, report });

  res.status(201).json({
    success: true,
    data: report.toObject({ select: REPORT_PUBLIC_FIELDS }),
    // Returned so the client can refresh the listing it was just reporting.
    trustScore,
  });
});

/**
 * @desc    List reports filed against a listing
 * @route   GET /api/v1/pulses/:id/reports
 * @access  Private (owner)
 *
 * Provider-facing, for the report history PRD F8 requires to be withheld from
 * customers. Deliberately excludes the reporter — an owner sees that reports
 * exist and what was said, never who said it.
 */
exports.getReportsForPulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);
  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }

  if (String(pulse.agent) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "You can only view reports filed against your own listing",
    });
  }

  const reports = await Report.find({ pulse: pulse._id })
    .sort({ createdAt: -1 })
    .select(REPORT_PUBLIC_FIELDS);

  res.status(200).json({ success: true, count: reports.length, data: reports });
});
