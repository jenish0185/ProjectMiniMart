const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

// Route to send a new chat message
router.post("/send-message", chatController.sendMessage);

// Route to get chat history between two users
router.get("/chat-history", chatController.getChatHistory);

router.get("/users/:receiverId", chatController.getReceiverProfile);

router.get("/participants/:userId", chatController.getChatParticipants);

router.post("/initialize-chat", chatController.initializeChat);

module.exports = router;