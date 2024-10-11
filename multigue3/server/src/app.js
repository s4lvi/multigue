// server/src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/build", "index.html"));
});
// Routes
app.use("/api/auth", authRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).send({ status: "Server is healthy" });
});

module.exports = app;
