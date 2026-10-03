const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  getPulses,
  getMyPulses,
  getPulseById,
  createPulse,
  updatePulse,
  updatePulseStatus,
  deletePulse,
} = require("../controllers/pulse.controller");
const { createReport, getReportsForPulse } = require("../controllers/report.controller");

router.route("/").get(getPulses).post(auth, createPulse);

// Must be declared before "/:id" below. Express matches in registration order,
// so a later "/mine" would be read as a listing whose id is the literal string
// "mine" and fail ObjectId casting with a confusing 500.
router.route("/mine").get(auth, getMyPulses);

router
  .route("/:id/status")
  .patch(auth, updatePulseStatus);

// Reporting. Auth is required because a report is tied to an account for
// anti-abuse (PRD F8), but no role gate: per the product decision, an account
// that holds both roles can report any provider EXCEPT itself, and the
// self-report block is enforced in the controller where the listing owner is
// actually known.
router
  .route("/:id/reports")
  .post(auth, createReport)
  .get(auth, getReportsForPulse);

router.route("/:id").get(getPulseById).put(auth, updatePulse).delete(auth, deletePulse);

module.exports = router;
