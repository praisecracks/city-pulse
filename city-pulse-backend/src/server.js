require("dotenv").config();
const net = require("net");
const app = require("./app");
const connectDB = require("./config/db");
const { applyFreshnessRule } = require("./services/freshnessService");
const { ensureAdminCreds } = require("./controllers/adminAuth.controller");

const DEFAULT_PORT = Number(process.env.PORT) || 5002;

function getAvailablePort(startPort, maxTries = 20) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, triesLeft) => {
      const tester = net.createServer();
      tester.once("error", (err) => {
        if (err.code === "EADDRINUSE" && triesLeft > 0) {
          return tryPort(port + 1, triesLeft - 1);
        }
        reject(err);
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, "0.0.0.0");
    };

    tryPort(startPort, maxTries);
  });
}

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

(async () => {
  try {
    const port = await getAvailablePort(DEFAULT_PORT);
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`City Pulse backend running on port ${port}`);
      console.log(`Server listening on: http://0.0.0.0:${port}`);
      ensureAdminCreds();
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    server.on("listening", () => {
      const addr = server.address();
      console.log("Server address:", addr);
    });
  } catch (err) {
    console.error("Unable to start the backend because no free port was found:", err.message);
    process.exit(1);
  }
})();
