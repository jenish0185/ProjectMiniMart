require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

// Define temporary storage for signup verification
const pendingVerificationCodes = {}; // For storing unverified codes
const pendingRegistrations = {}; 

// Import route handlers
const userRoutes = require("./routes/user.route");
const petRoutes = require("./routes/pet.route");
const adminRoutes = require("./routes/admin.route");
const adoptionRoutes = require("./routes/adoptionRequest.route");
const chatRoutes = require("./routes/chat.route"); // Chat routes
const forumRoutes = require("./routes/forum.route");
const discussRoutes = require("./routes/discuss.route"); // Add Discuss routes
const notificationRoute = require('./routes/notification.route');

// Import models and controllers
const User = require("./models/user.model");
const Chat = require("./models/chat.model");
const { sendMessage } = require("./controllers/chat.controller");

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS setup for handling cross-origin requests
app.use(
  cors({
    origin: ["https://tail-mate.vercel.app", "http://localhost:5173"],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Allow preflight OPTIONS for all routes
app.options('*', cors());

// Session middleware for Passport.js
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set to `true` if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;

        console.log("Google Profile:", profile);

        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: id });
        if (!user) {
          user = new User({
            name: displayName,
            email: emails[0].value, // Primary email from Google
            googleId: id,
            profilePic: photos[0]?.value || "", // Profile picture URL
            role: "individual", // Default role
          });
          await user.save();
        }

        done(null, user);
      } catch (err) {
        console.error("Error during Google OAuth:", err.message);
        done(err, null);
      }
    }
  )
);

// MongoDB connection setup
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // Ensure compatibility with newer MongoDB drivers
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process with failure if connection fails
  }
};

// Use routes
app.use("/users", userRoutes);
app.use("/pets", petRoutes);
app.use("/admin", adminRoutes);
app.use("/adoption", adoptionRoutes);
app.use("/chat", chatRoutes); // Add chat routes
app.use("/forum", forumRoutes);
app.use("/discuss", discussRoutes); // Add Discuss routes
app.use('/notifications', notificationRoute);

// Root route
app.get("/", (req, res) => {
  console.log("📩 Received GET request on /");
  res.status(200).json({ message: "Welcome to the Pet Adoption API!" });
});

// Google OAuth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle Google OAuth callback
// Handle Google OAuth callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      if (!req.user) {
        console.error("No user found after authentication");
        return res.status(400).json({ message: "Authentication failed" });
      }

      // Generate JWT token with additional user data
      const token = jwt.sign(
        {
          userId: req.user._id, // Include the MongoDB _id
          email: req.user.email, // Include the email
          name: req.user.name, // Include the name
          profilePic: req.user.profilePic, // Include the profile picture URL
          role: req.user.role, // Include the user's role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Token expiration time
      );

      console.log("User authenticated successfully:", req.user);

      // Redirect to frontend with the token
      res.redirect(
        `${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&profilePic=${encodeURIComponent(req.user.profilePic)}`
      );
      console.log("Redirecting to:", `${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&profilePic=${encodeURIComponent(req.user.profilePic)}`);
    } catch (err) {
      console.error("Error in /auth/google/callback:", err.message);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  }
);

// Ignore favicon.ico requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // Respond with no content
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`🔥 Server Error: ${err.stack}`);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://tail-mate.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
module.exports.io = io;

// Middleware to authenticate Socket.IO connections using JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // Extract token from handshake
  if (!token) return next(new Error("Authentication Error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user data to the socket
    next();
  } catch (err) {
    return next(new Error("Authentication Error"));
  }
});

// Handle Socket.IO events
io.on("connection", (socket) => {
  const userId = socket.user?.userId;
  if (!userId) return console.error("No userId found in socket connection");

  console.log("User Connected:", socket.id);

  // Join notification room
  socket.join(`notification-${userId}`);

  // Handle room joining
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User ${userId} joined room: ${room}`);
  });

  // Handle sending a message
  socket.on("sendMessage", async ({ room, senderId, receiverId, message }) => {
    try {
      const newMessage = new Chat({
        sender: senderId,
        receiver: receiverId,
        message,
      });

      const savedMessage = await newMessage.save();

      const populatedMessage = await Chat.findById(savedMessage._id)
        .populate("sender", "name")
        .populate("receiver", "name");

      io.to(room).emit("receiveMessage", populatedMessage);
      console.log("Broadcasting message to room:", room, populatedMessage);
    } catch (error) {
      console.error("Error saving or broadcasting message:", error.message);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});


// Start the server
const startServer = async () => {
  // Validate environment variables
  const requiredEnvVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "BASE_URL",
    "FRONTEND_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingEnvVars.join(", ")}. Please check your .env file.`
    );
    process.exit(1);
  }

  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

setInterval(() => {
  const now = Date.now();

  // Clean up expired pendingRegistrations
  for (const email in pendingRegistrations) {
    if (pendingRegistrations[email].verificationTokenExpiry < now) {
      delete pendingRegistrations[email];
    }
  }

  // Clean up expired pendingVerificationCodes
  for (const email in pendingVerificationCodes) {
    if (pendingVerificationCodes[email].expiresAt < now) {
      delete pendingVerificationCodes[email];
    }
  }

}, 60000); // Run every minute

startServer();