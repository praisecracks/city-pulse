const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const routes = require("./routes");
const { UPLOAD_DIR, PUBLIC_MOUNT, ensureUploadDir } = require("./config/uploads");

const app = express();

ensureUploadDir();

// --- Core middlewares ---
// cross-origin resource policy is relaxed so listing photos can be rendered by
// the Expo web build served from a different origin than the API.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// --- Static listing photos ---
// Filenames are content-unique, so they are safe to cache aggressively.
app.use(
  PUBLIC_MOUNT,
  express.static(UPLOAD_DIR, {
    maxAge: "30d",
    immutable: true,
    index: false,
    dotfiles: "deny",
  }),
);

// --- Health check ---
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "City Pulse API is live 🚦",
  });
});

// --- Routes ---
app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
