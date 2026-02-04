const mongoose = require("mongoose");

// Define the Forum Schema
const forumSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["lost", "found", "discussion"], // Example types, adjust as needed
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    petType: {
      type: String,
      required: true,
      trim: true,
    },
    petBreed: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: () => new Date().toISOString().split("T")[0], // Format as yyyy-MM-dd
    },
    images: {
      type: [String], // Array of strings to store multiple image URLs or paths
      default: [],    // Default value is an empty array
    },
    tags: {
      type: [String],
      default: [],
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensures a user must be associated with the post
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

// Create the Forum Model
const Forum = mongoose.model("Forum", forumSchema);

// Export the model
module.exports = Forum;