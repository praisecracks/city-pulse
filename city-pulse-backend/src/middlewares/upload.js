const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");

const {
  UPLOAD_DIR,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REQUEST,
  ALLOWED_MIME_TYPES,
  ensureUploadDir,
} = require("../config/uploads");

ensureUploadDir();

// Filenames are generated server-side, never derived from the client's
// original name. That removes path traversal and overwrite risk entirely, and
// keeps cache-busting trivial: the random suffix makes every URL unique.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES.get(file.mimetype) || ".jpg";
    const unique = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error("Only JPEG, PNG or WebP images are allowed");
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

// Expects the field name "photos". `files` caps the count so a single request
// cannot be used to fill the disk; `fileSize` caps each file.
const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
    fields: 10,
  },
});

// Owns the whole error path for uploads: every failure leaves here as the
// API's standard { success, message } JSON, and any partial files multer
// already wrote to disk are deleted so a rejected request stores nothing.
const handleUploadErrors = (err, req, res, next) => {
  if (!err) return next();

  // Best-effort cleanup; a failed unlink must not mask the original error.
  for (const file of req.files || []) {
    fs.unlink(file.path, () => {});
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Each image must be ${MAX_FILE_SIZE_MB}MB or smaller`
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? `You can upload at most ${MAX_FILES_PER_REQUEST} images in one go`
          : "Upload failed. Please try again.";

    return res.status(400).json({ success: false, message });
  }

  // The fileFilter rejects with a plain error carrying its own status code.
  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  return next(err);
};

module.exports = { uploadPhotos, handleUploadErrors };
