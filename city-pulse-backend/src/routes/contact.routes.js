const express = require("express");
const router = express.Router();

const {
    submitContact,
    getContacts,
    updateContactStatus,
} = require("../controllers/contact.controller");

router.post("/", submitContact);
router.get("/", getContacts);
router.patch("/:id", updateContactStatus);

module.exports = router;