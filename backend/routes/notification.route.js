const express = require("express");
const router = express.Router();
const {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification.controller");

// Route to fetch notifications for a specific user
router.get("/:userId/:role", getNotificationsForUser);

// Route to mark a notification as read
router.put("/mark-as-read/:notificationId", markNotificationAsRead);

router.put("/mark-all-read/:userId", markAllNotificationsAsRead);
module.exports = router;