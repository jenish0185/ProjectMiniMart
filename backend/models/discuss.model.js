const mongoose = require("mongoose");

// Define the Discuss Schema
const discussSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "All Categories",
        "General",
        "Pet Care",
        "Health",
        "Behavior",
        "Training",
        "Adoption",
      ], // Forum categories (refined list)
    },
    date: {
      type: Date,
      default: () => new Date().toISOString().split("T")[0], // Format as yyyy-MM-dd
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorImage: {
      type: String,
      required: false, // Optional field
      default: "/placeholder.svg", // Default placeholder image
    },
    upvotes: {
      type: Number,
      default: 0, // Default value is 0
    },
    downvotes: {
      type: Number,
      default: 0, // Default value is 0
    },
    userVote: {
      type: String,
      default: null, // Tracks user-specific vote (e.g., "upvote" or "downvote")
    },
    comments: {
      type: Number,
      default: 0, // Default value is 0
    },
    tags: {
      type: [String],
      default: [], // Default value is an empty array
    },
    isPinned: {
      type: Boolean,
      default: false, // Indicates if the topic is pinned
    },
    images: {
      type: [String], // Array of strings to store multiple image URLs or paths
      default: [], // Default value is an empty array
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensures a user must be associated with the post
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

// Create the Discuss Model
const Discuss = mongoose.model("Discuss", discussSchema);

// Export the model
module.exports = Discuss;