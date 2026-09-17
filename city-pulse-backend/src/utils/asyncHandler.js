// Wraps async route handlers so we don't need try/catch in every controller.
// Any rejected promise gets passed to Express's error-handling middleware.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
