const express = require("express");
const router = express.Router();

// Controllers
const {
  registerUser,
  sendVerificationEmail,
  verifyEmail,
  verifyCode,
  loginUser,
  updateUserProfile,
  deleteUserProfile,
  changePassword,
  forgotPasswordRequest,
  getShelters,
  getShelterById,
} = require("../controllers/user.controller");

// Middlewares
const verifyAuth = require("../middlewares/authMiddleware");

// Public Routes
router.post("/register", registerUser);        // Step 1: Start registration & send email verification link
router.get("/send-verification", sendVerificationEmail);
router.get("/verify-email", verifyEmail);     // Step 2: Verify email link → sends verification code
router.post("/verify-code", verifyCode);      // Step 3: Verify code → registers user in DB
router.post("/login", loginUser);

// Protected Routes (Require authentication)
router.put("/:userId", verifyAuth, updateUserProfile);
router.delete("/:userId", verifyAuth, deleteUserProfile);
router.put("/change-password/:userId", verifyAuth, changePassword);
router.post("/forgot-password", forgotPasswordRequest);

// Shelter-related routes
router.get("/shelters", getShelters);         // Get all shelters
router.get("/shelters/:id", getShelterById);  // Get shelter by ID

// Admin or Debug Route (optional — show all users)
router.get("/allusers", async (req, res) => {
  try {
    const users = await require("../models/user.model").find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;