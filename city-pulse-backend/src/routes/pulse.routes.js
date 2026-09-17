const express = require("express");
const router = express.Router();
const {
  getPulses,
  getPulseById,
  createPulse,
  updatePulse,
  deletePulse,
} = require("../controllers/pulse.controller");

router.route("/").get(getPulses).post(createPulse);

router.route("/:id").get(getPulseById).put(updatePulse).delete(deletePulse);

module.exports = router;
