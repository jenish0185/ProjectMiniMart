const Chat = require("../models/chat.model");
const User = require("../models/user.model");

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();



// Send a new chat message
exports.sendMessage = async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log("Received request body:", req.body);

    // Destructure senderId, receiverId, and message from the request body
    const { senderId, receiverId, message } = req.body;

    // Log individual fields for debugging
    console.log("senderId:", senderId);
    console.log("receiverId:", receiverId);
    console.log("message:", message);

    // Validate input: Ensure all required fields are present
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate ObjectIDs for senderId and receiverId
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid senderId or receiverId" });
    }

    // Create a new chat message document
    const newMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    // Save the message to the database
    const savedMessage = await newMessage.save();

    // Populate sender and receiver details
    const populatedMessage = await Chat.findById(savedMessage._id)
      .populate("sender", "name") // Populate sender's name
      .populate("receiver", "name"); // Populate receiver's name

    console.log("Populated message:", populatedMessage);

    // Return a success response with the populated message data
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    // Log any errors that occur during execution
    console.error("Error sending message:", error.message);

    // Return a generic 500 Internal Server Error response
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;

    // Validate input
    if (!userId1 || !userId2) {
      return res.status(400).json({ success: false, message: "Both user IDs are required" });
    }

    // Validate ObjectIDs
    if (
      !mongoose.Types.ObjectId.isValid(userId1) ||
      !mongoose.Types.ObjectId.isValid(userId2)
    ) {
      return res.status(400).json({ success: false, message: "Invalid user ID(s)" });
    }

    // Fetch chat history between the two users
    const chatHistory = await Chat.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    })
      .populate("sender", "name profilePic") // Populate sender details
      .populate("receiver", "name profilePic") // Populate receiver details
      .sort({ createdAt: 1 }) // Sort by timestamp
      .limit(50); // Limit to the last 50 messages for performance

    console.log("Chat history:", chatHistory);

    res.status(200).json({ success: true, data: chatHistory });
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getReceiverProfile = async (req, res) => {
  const { receiverId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json({ success: false, message: "Invalid receiver ID." });
  }

  try {
    const receiver = await User.findById(receiverId, "name email phoneNumber bio role profilePic");

    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found." });
    }

    res.status(200).json({ success: true, user: receiver });
  } catch (error) {
    console.error("Error fetching receiver profile:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching receiver profile." });
  }
};


// Get all users the current user has chatted with
exports.getChatParticipants = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    // Fetch participants
    const participants = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }],
        },
      },
      {
        $project: {
          otherUser: {
            $cond: {
              if: { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },
      { $group: { _id: "$otherUser" } },
    ]);

    // Extract user IDs
    const participantIds = participants.map((p) => p._id);

    // Fetch user details
    const users = await User.find(
      { _id: { $in: participantIds } },
      "name email phoneNumber bio role profilePic"
    );

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching chat participants:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



// Check if a chat exists between two users, and create one if it doesn't
exports.initializeChat = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    // Validate input
    if (!senderId || !receiverId) {
      return res.status(400).json({ success: false, message: "Both senderId and receiverId are required." });
    }

    // Validate ObjectIDs
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid senderId or receiverId." });
    }

    // Check if any chat history exists between the two users
    const existingChat = await Chat.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingChat) {
      // If a chat exists, return success
      return res.status(200).json({ success: true, message: "Chat already exists.", data: existingChat });
    }

    // If no chat exists, create a dummy entry
    const newChat = new Chat({
      sender: senderId,
      receiver: receiverId,
      message: "Chat initialized.",
    });

    await newChat.save();

    res.status(201).json({ success: true, message: "New chat created.", data: newChat });
  } catch (error) {
    console.error("Error initializing chat:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};