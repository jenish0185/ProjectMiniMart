// notification.controller.js
const { createNotification } = require("../utils/notificationUtils");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");

// Send notification when a user registers
exports.notifyOnRegistration = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const adminMessage = `New user (${user.name}) registered at ${new Date().toLocaleString()}`;
  const userMessage = `Welcome, ${user.name}! Your account has been successfully created.`;

  // Notify admin
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    createNotification(admin._id, "admin", adminMessage);
  }

  // Notify user
  createNotification(user._id, "user", userMessage);
};

// Send notification when a user logs in
exports.notifyOnLogin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const adminMessage = `User (${user.name}) logged in at ${new Date().toLocaleString()}`;

  // Notify admin
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    createNotification(admin._id, "admin", adminMessage);
  }
};

// Send notification when a user updates their profile or changes password
exports.notifyOnUpdateOrPasswordChange = async (userId, action) => {
  const user = await User.findById(userId);
  if (!user) return;

  const adminMessage = `User (${user.name}) ${action} their account at ${new Date().toLocaleString()}`;
  const userMessage = `Your account has been ${action} successfully.`;

  // Notify admin
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    createNotification(admin._id, "admin", adminMessage);
  }

  // Notify user
  createNotification(user._id, "user", userMessage);
};

// Send notification when a user deletes their account
exports.notifyOnDeletion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const adminMessage = `User (${user.name}) deleted their account at ${new Date().toLocaleString()}`;

  // Notify admin
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    createNotification(admin._id, "admin", adminMessage);
  }
};

// Fetch notifications for a specific user
exports.getNotificationsForUser = async (req, res) => {
  const { userId, role } = req.params;

  try {
    // Validate user and role
    const user = await User.findById(userId);
    if (!user || user.role !== role) {
      return res.status(400).json({ message: "Invalid user or role" });
    }

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      notifications,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    // Find the notification and update the `isRead` field
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Mark all notifications as read for a specific user
exports.markAllNotificationsAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    // Update all notifications where userId matches and isRead is false
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        message: "No unread notifications found or all were already read.",
      });
    }

    res.status(200).json({
      message: `${result.modifiedCount} notification(s) marked as read.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};