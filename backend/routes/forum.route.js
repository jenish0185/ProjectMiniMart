const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
} = require("../controllers/forum.controller");

const verifyAuth = require("../middlewares/authMiddleware"); // Authentication middleware

// General Post Actions
router.post("/create", verifyAuth, createPost); // Create a new post
router.get("/all", verifyAuth, getAllPosts); // Get all posts (with optional filters)
router.get("/details/:postId", verifyAuth, getPostById); // Get a single post by ID fot he post details page

// User-Specific Post Actions
router.get("/user/my-posts", verifyAuth, getMyPosts); // Get all posts created by the authenticated user
router.put("/user/edit/:postId", verifyAuth, updatePost); // Update a specific post
router.delete("/user/delete/:postId", verifyAuth, deletePost); // Delete a specific post

module.exports = router;