require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// Import route handlers
const userRoutes = require("./routes/user.route");

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS setup for handling cross-origin requests
app.use(
  cors({
    origin: ["https://project-mini-mart.vercel.app", "http://localhost:5173"],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Allow preflight OPTIONS for all routes
app.options('*', cors());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  }
};

// Routes
app.use("/users", userRoutes);

// Example test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
