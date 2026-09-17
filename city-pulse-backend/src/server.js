require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// City Pulse backend entry point.
connectDB().catch((err) => {
  console.warn("Running without a database connection:", err.message);
});

app.listen(PORT, () => {
  console.log(`City Pulse backend running on port ${PORT}`);
});