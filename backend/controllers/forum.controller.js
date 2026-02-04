const Forum = require("../models/forum.model");

// Create a new forum post
exports.createPost = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      petType,
      petBreed,
      location,
      date,
      tags,
      urgent,
      reward,
      images, // Changed from 'image' to 'images' (array)
    } = req.body;

    // Ensure the user is authenticated and their ID is available (from middleware)
    const userId = req.user.id;

    // Validate required fields
    if (!type || !title || !description || !petType || !location || !date) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate that images is an array (if provided)
    if (images && !Array.isArray(images)) {
      return res.status(400).json({ message: "Images must be provided as an array" });
    }

    // Create the post
    const newPost = new Forum({
      type,
      title,
      description,
      petType,
      petBreed,
      location,
      date,
      tags,
      urgent,
      reward,
      images: images || [], // Default to an empty array if no images are provided
      user: userId, // Associate the post with the user
    });

    await newPost.save();

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all posts with optional filters
exports.getAllPosts = async (req, res) => {
  try {
    const { type, searchTerm, sortBy } = req.query;

    let query = {};

    // Filter by post type (lost/found/discussion)
    if (type && ["lost", "found"].includes(type)) {
      query.type = type;
    }

    // Search by title, description, pet type, breed, or location
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { petType: { $regex: term, $options: "i" } },
        { petBreed: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ];
    }

    // Fetch posts from the database
    const posts = await Forum.find(query)
      .populate("user", "name email profilePic")
      .sort(getSortCriteria(sortBy));

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post by ID and populate the user details
    const post = await Forum.findById(postId).populate("user", "name email profilePic");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all posts created by the authenticated user
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch posts created by the authenticated user
    const posts = await Forum.find({ user: userId })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a specific post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      type,
      title,
      description,
      petType,
      petBreed,
      location,
      date,
      tags,
      urgent,
      reward,
      images, // Changed from 'image' to 'images' (array)
    } = req.body;

    const userId = req.user.id;

    // Find the post by ID
    const post = await Forum.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user owns the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this post" });
    }

    // Update the post fields
    post.type = type || post.type;
    post.title = title || post.title;
    post.description = description || post.description;
    post.petType = petType || post.petType;
    post.petBreed = petBreed || post.petBreed;
    post.location = location || post.location;
    post.date = date || post.date;
    post.tags = tags || post.tags;
    post.urgent = urgent || post.urgent;
    post.reward = reward || post.reward;

    // Handle images (validate and update)
    if (images) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images must be provided as an array" });
      }
      post.images = images; // Update the images array
    }

    await post.save();

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a specific post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const userId = req.user.id;

    // Find the post by ID
    const post = await Forum.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user owns the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    // Delete the post
    await Forum.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to determine sort criteria
function getSortCriteria(sortBy) {
  switch (sortBy) {
    case "newest":
      return { date: -1 };
    case "oldest":
      return { date: 1 };
    case "popular":
      return { upvotes: -1 };
    default:
      return { createdAt: -1 }; // Default to newest
  }
}