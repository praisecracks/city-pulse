const fs = require("fs");
const path = require("path");

// Uploaded photos live on disk under UPLOAD_DIR and are served statically
// from PUBLIC_MOUNT. Set UPLOAD_DIR in .env to move them to a mounted volume
// (or a directory your CDN/object-storage sync job watches) without code changes.
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "..", "..", "uploads");

// Public URL prefix that app.js mounts the static handler on.
const PUBLIC_MOUNT = "/uploads";

// Keep in sync with MAX_LISTING_PHOTOS / MAX_IMAGE_SIZE_MB in the mobile app
// (apps/mobile/.../src/utils/image-upload.ts) so the two never disagree.
const MAX_FILE_SIZE_MB = 5;
const MAX_FILES_PER_REQUEST = 4;

const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Only raster formats the mobile app can actually produce. Anything else
// (SVG, HEIC we cannot transcode, PDFs) is rejected at the boundary.
const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

// Resolves a stored filename to a public URL path. The controller prefixes the
// request host so the same stored path works from any device.
function toPublicPath(filename) {
  return `${PUBLIC_MOUNT}/${filename}`;
}

// Identifies an image from its leading bytes.
//
// The Content-Type a client declares is not evidence of anything: a client that
// failed to read its own file can easily post a text body under
// "image/jpeg", and multer's fileFilter would accept it and write it to disk as
// a .jpg. Those files then 200 from the static handler, carry an image content
// type, and render as broken images in every client. Checking the bytes
// themselves is the only point where that is still catchable.
function sniffImageMime(bytes) {
  if (!Buffer.isBuffer(bytes)) return null;

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  const isPng =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (isPng) return "image/png";

  const isWebp =
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (isWebp) return "image/webp";

  return null;
}

module.exports = {
  UPLOAD_DIR,
  PUBLIC_MOUNT,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REQUEST,
  ALLOWED_MIME_TYPES,
  ensureUploadDir,
  toPublicPath,
  sniffImageMime,
};
