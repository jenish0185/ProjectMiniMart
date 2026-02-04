const Discuss = require("../models/discuss.model");

// Create a new discussion post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, isPinned, images } = req.body;

    // Ensure the user is authenticated and their ID is available (from middleware)
    const userId = req.user.id;
    const userName = req.user.name; // Assuming `req.user` contains the user's name
    const userProfilePic = req.user.profilePic || "/placeholder.svg"; // Default placeholder image

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate that images is an array (if provided)
    if (images && !Array.isArray(images)) {
      return res.status(400).json({ message: "Images must be provided as an array" });
    }

    // Create the discussion post
    const newDiscussion = new Discuss({
      title,
      content,
      category,
      author: userName, // Use the authenticated user's name
      authorImage: userProfilePic, // Use the authenticated user's profile picture
      tags: tags || [], // Default to an empty array if no tags are provided
      isPinned: isPinned || false, // Default to false if not pinned
      images: images || [], // Default to an empty array if no images are provided
      user: userId, // Associate the post with the user
    });

    await newDiscussion.save();

    res.status(201).json({ message: "Discussion created successfully", post: newDiscussion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all discussion posts with optional filters
exports.getAllPosts = async (req, res) => {
  try {
    const { category, searchTerm, sortBy } = req.query;

    let query = {};

    // Log incoming query parameters
    console.log("Query Parameters:", { category, searchTerm, sortBy });

    // Filter by category
    if (category && [
      "All Categories",
      "General",
      "Pet Care",
      "Health",
      "Behavior",
      "Training",
      "Adoption",
    ].includes(category)) {
      query.category = category;
    }

    // Search by title, content, author, or tags
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { content: { $regex: term, $options: "i" } },
        { author: { $regex: term, $options: "i" } },
        { tags: { $regex: term, $options: "i" } },
      ];
    }

    // Log the constructed query
    console.log("Constructed Query:", query);

    // Fetch posts from the database
    const posts = await Discuss.find(query)
      .populate("user", "name email profilePic") // Populate user details
      .sort(getSortCriteria(sortBy));

    // Log the fetched posts
    console.log("Fetched Posts:", posts);

    // Send the response
    res.status(200).json({ posts });
  } catch (error) {
    // Log the error details
    console.error("Error in getAllPosts:", error);

    // Return a generic error response
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch a single discussion post by ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post by ID and populate the user details
    const post = await Discuss.findById(postId)
      .populate("user", "name email profilePic") // Populate user details
      .lean(); // Optional: Use lean() for better performance

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Upvote Endpoint
exports.upvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Assuming user ID is extracted from the token

    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if the user has already voted
    if (post.userVote === "upvote") {
      // Remove the upvote
      post.upvotes -= 1;
      post.userVote = null;
    } else if (post.userVote === "downvote") {
      // Change downvote to upvote
      post.upvotes += 2; // +1 for removing downvote, +1 for adding upvote
      post.userVote = "upvote";
    } else {
      // Add an upvote
      post.upvotes += 1;
      post.userVote = "upvote";
    }

    await post.save();

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Downvote Endpoint
exports.downvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Assuming user ID is extracted from the token

    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Check if the user has already voted
    if (post.userVote === "downvote") {
      // Remove the downvote
      post.upvotes += 1;
      post.userVote = null;
    } else if (post.userVote === "upvote") {
      // Change upvote to downvote
      post.upvotes -= 2; // -1 for removing upvote, -1 for adding downvote
      post.userVote = "downvote";
    } else {
      // Add a downvote
      post.upvotes -= 1;
      post.userVote = "downvote";
    }

    await post.save();

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all discussion posts created by the authenticated user
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch posts created by the authenticated user
    const posts = await Discuss.find({ user: userId })
      .populate("user", "name email profilePic images") // Populate user details
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a specific discussion post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category, tags, isPinned, images } = req.body;

    const userId = req.user.id;

    // Find the post by ID
    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user owns the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this post" });
    }

    // Update the post fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.tags = tags || post.tags;
    post.isPinned = isPinned || post.isPinned;

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

// Delete a specific discussion post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const userId = req.user.id;

    // Find the post by ID
    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user owns the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    // Delete the post
    await Discuss.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.upvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Extract user ID from token

    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userVote === "upvote") {
      // Remove the upvote
      post.upvotes -= 1;
      post.userVote = null;
    } else if (post.userVote === "downvote") {
      // Change downvote to upvote
      post.upvotes += 2;
      post.userVote = "upvote";
    } else {
      // Add an upvote
      post.upvotes += 1;
      post.userVote = "upvote";
    }

    await post.save();

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


exports.downvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Extract user ID from token

    const post = await Discuss.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userVote === "downvote") {
      // Remove the downvote
      post.upvotes += 1;
      post.userVote = null;
    } else if (post.userVote === "upvote") {
      // Change upvote to downvote
      post.upvotes -= 2;
      post.userVote = "downvote";
    } else {
      // Add a downvote
      post.upvotes -= 1;
      post.userVote = "downvote";
    }

    await post.save();

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



// Helper function to determine sort criteria
function getSortCriteria(sortBy) {
  switch (sortBy) {
    case "newest":
      return { createdAt: -1 };
    case "oldest":
      return { createdAt: 1 };
    case "popular":
      return { upvotes: -1 };
    default:
      return { createdAt: -1 }; // Default to newest
  }
}