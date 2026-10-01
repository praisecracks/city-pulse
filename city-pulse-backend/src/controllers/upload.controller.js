const asyncHandler = require("../utils/asyncHandler");
const fs = require("fs");
const { MAX_FILE_SIZE_MB, toPublicPath, sniffImageMime } = require("../config/uploads");

function absoluteUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}${toPublicPath(filename)}`;
}

// Confirms the bytes on disk really are an image and not a body the client
// mislabelled. The declared Content-Type is not enough — see sniffImageMime.
// A file that fails is deleted rather than returned, so a corrupt upload never
// becomes a URL the app will keep rendering.
async function assertRealImage(file) {
  const handle = await fs.promises.open(file.path, "r");
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(12), 0, 12, 0);
    return Boolean(sniffImageMime(buffer.subarray(0, bytesRead)));
  } finally {
    await handle.close();
  }
}

// @desc    Upload listing photos
// @route   POST /api/v1/uploads/images
// @access  Private (agent)
//
// Photos are uploaded before the listing is created and the returned URLs are
// then referenced from POST /pulses. Keeping the two calls separate means a
// failed listing submission can be retried without re-sending the bytes, and
// the pulse payload stays small JSON.
exports.uploadImages = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Attach at least one image under the 'photos' field",
    });
  }

  // Every file is verified before any URL is handed out, so a request carrying
  // one good photo and one junk photo fails as a whole instead of leaving the
  // listing pointing at a mix of real and broken images.
  const verdicts = await Promise.all(
    files.map(async (file) => {
      const isImage = await assertRealImage(file).catch(() => false);
      return { file, isImage };
    }),
  );

  const rejected = verdicts.filter((verdict) => !verdict.isImage);
  if (rejected.length > 0) {
    await Promise.allSettled(rejected.map(({ file }) => fs.promises.unlink(file.path)));
    return res.status(400).json({
      success: false,
      message: "One of the files was not a readable JPEG, PNG or WebP image. Nothing was saved — please try again.",
    });
  }

  const images = files.map((file) => ({
    url: absoluteUrl(req, file.filename),
    path: toPublicPath(file.filename),
    size: file.size,
    mimetype: file.mimetype,
  }));

  res.status(201).json({
    success: true,
    count: images.length,
    message: `${images.length} image${images.length === 1 ? "" : "s"} uploaded. Keep each under ${MAX_FILE_SIZE_MB}MB.`,
    data: { images },
  });
});
