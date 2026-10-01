const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const auth = require("../middlewares/auth");
const { uploadPhotos, handleUploadErrors } = require("../middlewares/upload");
const { uploadImages } = require("../controllers/upload.controller");
const { MAX_FILES_PER_REQUEST } = require("../config/uploads");

// Uploads are the most expensive endpoint in the API (disk writes), so they get
// a tighter budget than the OTP limiter.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many uploads. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/images",
  auth,
  uploadLimiter,
  uploadPhotos.array("photos", MAX_FILES_PER_REQUEST),
  handleUploadErrors,
  uploadImages,
);

module.exports = router;
