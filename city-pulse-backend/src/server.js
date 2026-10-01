require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { applyFreshnessRule } = require("./services/freshnessService");

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const FRESHNESS_INTERVAL_MS = 30 * 60 * 1000;

connectDB()
  .then(async () => {
    console.log("Database connected");
    await applyFreshnessRule();
    console.log("Freshness rule applied");
  })
  .catch((err) => {
    console.warn("Running without a database connection:", err.message);
  });

/**
 * Runs the freshness rule on a fixed interval.
 *
 * Re-armed after every run rather than using `setInterval`: the rule makes
 * several database queries and fans out notifications, so a run that outlasted
 * the interval would otherwise have the next one queued up behind it, and
 * several lapses could then land together. Chaining keeps exactly one run in
 * flight at a time.
 *
 * Ticks at the warning window's own resolution, so the "about to lapse" pass is
 * always sampled at least once before anything actually lapses.
 */
let freshnessRunning = false;
function scheduleFreshness() {
  setTimeout(async () => {
    if (!freshnessRunning) {
      freshnessRunning = true;
      try {
        await applyFreshnessRule();
      } catch (err) {
        // A failed sweep must not kill the timer; the next one may well succeed.
        console.error("Freshness rule failed:", err.message);
      } finally {
        freshnessRunning = false;
      }
    }
    scheduleFreshness();
  }, FRESHNESS_INTERVAL_MS).unref();
}

scheduleFreshness();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`City Pulse backend running on port ${PORT}`);
  console.log(`Server listening on: http://0.0.0.0:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

server.on("listening", () => {
  const addr = server.address();
  console.log("Server address:", addr);
});
