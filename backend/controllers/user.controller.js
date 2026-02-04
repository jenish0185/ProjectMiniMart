const pendingRegistrations = {}; // For storing user data temporarily
const pendingVerificationCodes = {}; // For storing verification codes

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Pet = require("../models/pet.model");
const Notification = require("../models/notification.model");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const transporter = require("../utils/mailer");



const router = express.Router();


// Helper function to create notifications
const createNotification = async (userId, type, message) => {
  try {
    const notification = new Notification({
      userId,
      type,
      message,
    });
    await notification.save();
  } catch (err) {
    console.error("Error creating notification:", err.message);
  }
};

// Register User (individual or shelter)
const registerUser = async (req, res) => {
  const { name, email, phoneNumber, password, bio, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      bio,
      role,
      pets: [],
      adoptedPets: [],
      isVerified: true, // Mark as verified since we've completed email + code flow
    });

    await newUser.save();

    // Optional: Delete from pendingRegistrations if used earlier
    if (pendingRegistrations[email]) {
      delete pendingRegistrations[email];
    }

    res.status(201).json({ message: "Registration successful!" });

  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Send Verification Email
const sendVerificationEmail = async (req, res) => {
  const { email } = req.query;
  try {
    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Send email without saving to DB
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Verification Code",
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
             <p>This code will expire in 5 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);

    // Store email & code temporarily
    pendingVerificationCodes[email] = {
      code: verificationCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 2 minutes
    };

    res.status(200).json({
      message: "Verification code sent successfully!",
    });
  } catch (err) {
    console.error("Error sending verification email:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const now = Date.now();
    let foundKey = null;
    let userData = null;

    // Find matching email based on verification token
    for (const key in pendingRegistrations) {
      const entry = pendingRegistrations[key];
      if (entry.verificationToken === token && entry.verificationTokenExpiry > now) {
        foundKey = key;
        userData = entry;
        break;
      }
    }

    if (!userData) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    verificationCodeExpires: Date.now() + 5 * 60 * 1000,

      // Update pending registration with verification code
      pendingRegistrations[foundKey].verificationCode = verificationCode;
    pendingRegistrations[foundKey].verificationCodeExpires = verificationCodeExpires;

    // Send verification code via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: "Your Verification Code",
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
             <p>This code will expire in 5 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email verified. Verification code sent." });

  } catch (err) {
    console.error("Error verifying email:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  const stored = pendingVerificationCodes[email];
  if (
    !stored ||
    stored.code !== parseInt(code) ||
    stored.expiresAt < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  // Optional: Delete the code after successful verification
  // delete pendingVerificationCodes[email];

  res.status(200).json({ message: "Code verified successfully!" });
};



// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("body: ", req.body);
  console.log("email: ", email);
  console.log("password: ", password);
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Check if the user is a Google-authenticated user
    if (user.googleId && !password) {
      // Allow login without a password for Google-authenticated users
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Send notification to the admin
      const adminMessage = `User (${user.name}) logged in at ${new Date().toLocaleString()}`;
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        await createNotification(admin._id, "admin", adminMessage);
      }

      return res.status(200).json({
        token,
        user: user,
      });
    }

    // Compare passwords for non-Google users
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send notification to the admin
    const adminMessage = `User (${user.name}) logged in at ${new Date().toLocaleString()}`;
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification(admin._id, "admin", adminMessage);
    }

    // Return success response
    res.status(200).json({
      token,
      user: user,
    });
  } catch (err) {
    console.error("Login Error:", err); // Log the error for debugging
    res.status(500).json({ message: "Server error: " + err.message }); // Return JSON instead of plain text
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, email, phoneNumber, bio, profilePic } = req.body;

  try {
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this profile" });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.bio = bio || user.bio;
    user.profilePic = profilePic || user.profilePic;

    await user.save();

    // Send notification to the user
    const userMessage = `Your profile has been updated successfully at ${new Date().toLocaleString()}`;
    await createNotification(user._id, "user", userMessage);

    // Send notification to the admin
    const adminMessage = `User (${user.name}) updated their profile at ${new Date().toLocaleString()}`;
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification(admin._id, "admin", adminMessage);
    }

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Delete User Profile
const deleteUserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure the user is authorized to delete their profile
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this profile" });
    }

    // Find the user and populate their pets
    const user = await User.findById(userId).populate("pets");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all pets associated with this user
    await Pet.deleteMany({ _id: { $in: user.pets } });

    // Delete the user profile
    await User.findByIdAndDelete(userId);

    // Send notification to the admin
    const adminMessage = `User (${user.name}) deleted their account at ${new Date().toLocaleString()}`;
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification(admin._id, "admin", adminMessage);
    }

    res.status(200).json({ message: "User profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Change Password API Endpoint
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, email } = req.body;
  try {
    let user;

    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      // Verify code was used before allowing password reset
      const stored = pendingVerificationCodes[email];
      if (!stored || stored.expiresAt < Date.now()) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      delete pendingVerificationCodes[email]; // Clear after use
    } else {
      // Normal password change
      const { userId } = req.params;
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Only check currentPassword if we are not using email-based reset
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required." });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    // Notify user and admin
    const userMessage = `Your password has been changed successfully at ${new Date().toLocaleString()}`;
    await createNotification(user._id, "user", userMessage);

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      const adminMessage = `User (${user.name}) changed their password at ${new Date().toLocaleString()}`;
      await createNotification(admin._id, "admin", adminMessage);
    }

    res.status(200).json({ message: "Password changed successfully!" });

  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Send reset password code
const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    pendingVerificationCodes[email] = {
      code: verificationCode,
      expiresAt,
    };

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      html: `<p>Your password reset code is: <strong>${verificationCode}</strong></p>
             <p>This code will expire in 5 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset code sent successfully!",
    });

  } catch (err) {
    console.error("Error sending password reset code:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};


// Controller to fetch all shelters with necessary details
const getShelters = async (req, res) => {
  try {
    const shelters = await User.find({ role: "shelter" })
      .select("name email phoneNumber bio profilePic role createdAt isVerified");

    res.status(200).json({
      success: true,
      shelters: shelters,
    });
  } catch (err) {
    console.error("Error fetching shelters:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};

const getShelterById = async (req, res) => {
  try {
    const shelter = await User.findById(req.params.id)
      .select("name email phoneNumber bio profilePic role createdAt isVerified pets")
      .populate("pets", "name type breed age status specialNeeds petPic"); // Only select needed pet fields

    if (!shelter || shelter.role !== "shelter") {
      return res.status(404).json({ message: "Shelter not found" });
    }

    res.status(200).json(shelter);
  } catch (err) {
    console.error("Error fetching shelter:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  sendVerificationEmail,
  verifyEmail,
  verifyCode,
  loginUser,
  updateUserProfile,
  deleteUserProfile,
  forgotPasswordRequest,
  changePassword,
  getShelters,
  getShelterById,
};