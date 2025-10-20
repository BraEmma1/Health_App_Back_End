import { Post } from "../models/postModel.js";
import mongoose from "mongoose";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const {
      type,
      content,
      media = [],
      tags = [],
      mentions = [],
      communityId = null,
      visibility = "public",
    } = req.body;

    // Create the post
    const newPost = new Post({
      authorId: req.user._id,
      type,
      content,
      media,
      tags,
      mentions,
      communityId,
      visibility,
    });

    await newPost.save();

    // Populate author information
    await newPost.populate("authorId", "firstName lastName profilePicture");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all posts with pagination and filtering
export const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      communityId,
      authorId,
      visibility = "public",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {
      isActive: true,
      "moderation.status": { $ne: "removed" },
    };

    if (type) filter.type = type;
    if (communityId) filter.communityId = communityId;
    if (authorId) filter.authorId = authorId;
    if (visibility) filter.visibility = visibility;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const posts = await Post.find(filter)
      .populate("authorId", "firstName lastName profilePicture role")
      .populate("communityId", "name")
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get a single post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "firstName lastName profilePicture role")
      .populate("communityId", "name")
      .populate("mentions.userId", "firstName lastName username");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author or admin
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    // Check if post is removed
    if (post.moderation.status === "removed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update removed post",
      });
    }

    // Update allowed fields
    const allowedUpdates = ["content", "media", "tags", "mentions", "visibility"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();
    await post.populate("authorId", "firstName lastName profilePicture");

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a post (soft delete)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author or admin
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get posts by author
export const getPostsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const filter = {
      authorId,
      isActive: true,
      "moderation.status": { $ne: "removed" },
    };

    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filter)
      .populate("authorId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPosts = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching posts by author:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get trending posts
export const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const posts = await Post.getTrendingPosts(parseInt(limit), parseInt(skip));

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Search posts
export const searchPosts = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const filter = {
      isActive: true,
      "moderation.status": { $ne: "removed" },
      visibility: "public",
      $or: [
        { content: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { searchKeywords: { $in: [new RegExp(q, "i")] } },
      ],
    };

    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filter)
      .populate("authorId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPosts = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Moderate a post (admin only)
export const moderatePost = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["ok", "flagged", "removed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moderation status",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.moderation.status = status;
    post.moderation.reason = reason;
    post.moderation.flaggedBy = req.user._id;
    post.moderation.flaggedAt = new Date();

    if (status === "removed") {
      post.isActive = false;
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: `Post ${status} successfully`,
      post,
    });
  } catch (error) {
    console.error("Error moderating post:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get posts by type
export const getPostsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    if (!["text", "image", "video", "article", "question"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post type",
      });
    }

    const posts = await Post.getPostsByType(type, parseInt(limit), parseInt(skip));

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts by type:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get my posts (authenticated user's posts)
export const getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const filter = {
      authorId: req.user._id,
      isActive: true,
    };

    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filter)
      .populate("authorId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPosts = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
