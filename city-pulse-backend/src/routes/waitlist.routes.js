const express = require("express");
const router = express.Router();

const {
    joinUserWaitlist,
    joinAgentWaitlist,
    getUserWaitlist,
    getAgentWaitlist,
} = require("../controllers/waitlist.controller");

router.post("/user", joinUserWaitlist);
router.get("/user", getUserWaitlist);

router.post("/agent", joinAgentWaitlist);
router.get("/agent", getAgentWaitlist);

module.exports = router;