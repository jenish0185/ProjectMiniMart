const express = require("express");
const router = express.Router();

// Import controller functions for the Discuss model
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
  upvotePost, // Add the upvote controller
  downvotePost, // Add the downvote controller
} = require("../controllers/discuss.controller");

// Import authentication middleware
const verifyAuth = require("../middlewares/authMiddleware"); // Authentication middleware

// General Discussion Post Actions
router.post("/create", verifyAuth, createPost); // Create a new discussion post
router.get("/all", verifyAuth, getAllPosts); // Get all discussion posts (with optional filters)
router.get("/details/:postId", verifyAuth, getPostById); // Get a single discussion post by ID (for the post details page)

// User-Specific Discussion Post Actions
router.get("/user/my-posts", verifyAuth, getMyPosts); // Get all discussion posts created by the authenticated user
router.put("/user/edit/:postId", verifyAuth, updatePost); // Update a specific discussion post
router.delete("/user/delete/:postId", verifyAuth, deletePost); // Delete a specific discussion post

// Upvote and Downvote Routes
router.post("/upvote/:postId", verifyAuth, upvotePost); // Upvote a specific discussion post
router.post("/downvote/:postId", verifyAuth, downvotePost); // Downvote a specific discussion post

module.exports = router;