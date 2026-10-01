const User = require("../models/user.model");
const Pulse = require("../models/pulse.model");
const asyncHandler = require("../utils/asyncHandler");

// A client holding a stale id would otherwise grow the array without bound and
// the user would have no way to clear an entry they can no longer see.
const MAX_FAVORITES = 200;

/**
 * @desc    Get the signed-in account's saved listings
 * @route   GET /api/v1/auth/me/favorites
 * @access  Private
 *
 * Resolved to full listings rather than returned as bare ids, so the client does
 * not have to make a second request and cannot render a saved row it is unable
 * to resolve. Ids that no longer correspond to a live listing are dropped from
 * the stored array on the way past, so unpublishing cleans up after itself.
 */
exports.getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "favorites",
    // A saved listing whose provider unpublished it leaves a null hole, which is
    // filtered below and pruned from the stored array.
    select: "-__v",
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const live = user.favorites.filter(Boolean);
  const ids = live.map((listing) => String(listing._id));

  if (ids.length !== user.favorites.length) {
    user.favorites = live.map((listing) => listing._id);
    await user.save();
  }

  res.status(200).json({ success: true, count: ids.length, data: live, favorites: ids });
});

/**
 * @desc    Add a listing to the account's saved list
 * @route   POST /api/v1/auth/me/favorites
 * @access  Private
 */
exports.addFavorite = asyncHandler(async (req, res) => {
  const { pulseId } = req.body || {};

  const pulse = await Pulse.findById(pulseId);
  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const already = user.favorites.some((id) => String(id) === String(pulseId));
  if (!already) {
    if (user.favorites.length >= MAX_FAVORITES) {
      // Oldest first, because the array is append-ordered.
      user.favorites.shift();
    }
    user.favorites.push(pulse._id);
    await user.save();
  }

  res.status(200).json({ success: true, favorites: user.favorites.map(String) });
});

/**
 * @desc    Remove a listing from the account's saved list
 * @route   DELETE /api/v1/auth/me/favorites/:pulseId
 * @access  Private
 *
 * Idempotent: removing something that was never saved succeeds, so a double tap
 * cannot surface an error.
 */
exports.removeFavorite = asyncHandler(async (req, res) => {
  const { pulseId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.favorites = user.favorites.filter((id) => String(id) !== String(pulseId));
  await user.save();

  res.status(200).json({ success: true, favorites: user.favorites.map(String) });
});
