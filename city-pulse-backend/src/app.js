const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const routes = require("./routes");

const app = express();

// --- Core middlewares ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

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
