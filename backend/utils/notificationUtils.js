const Notification = require("../models/notification.model");
const io = require("../socket"); // Import the Socket.IO instance

const createNotification = async (userId, type, message) => {
  try {
    const notification = new Notification({ userId, type, message });
    await notification.save();

    if (type === "admin") {
      // Notify all admins (broadcast to all connected admins)
      console.log("Emitting admin notification to all admins");
      io.emit("adminNotification", { notification });
    } else {
      // Notify the specific user by emitting to their notification room
      console.log(`Emitting notification to user: ${userId}`);
      io.to(`notification-${userId}`).emit("newNotification", { notification });
    }

    console.log(`Notification created and emitted`);
  } catch (err) {
    console.error("Error creating notification:", err.message);
  }
};

module.exports = { createNotification };