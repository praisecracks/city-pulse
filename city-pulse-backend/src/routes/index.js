const express = require("express");
const router = express.Router();

const pulseRoutes = require("./pulse.routes");

router.use("/pulses", pulseRoutes);

module.exports = router;
