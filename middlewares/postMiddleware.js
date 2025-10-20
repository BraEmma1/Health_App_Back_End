import { Post } from "../models/postModel.js";
import mongoose from "mongoose";

// Middleware to check if post exists and is accessible
export const checkPostAccess = async (req, res, next) => {
  try {
    const postId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is active
    if (!post.isActive) {
      return res.status(404).json({
        success: false,
        message: "Post is no longer available",
      });
    }

    // Check if post is removed
    if (post.moderation.status === "removed") {
      return res.status(404).json({
        success: false,
        message: "Post has been removed",
      });
    }

    // Check visibility permissions
    if (post.visibility === "private") {
      if (!req.user || post.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Post is private",
        });
      }
    }

    if (post.visibility === "community") {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view community posts",
        });
      }
      // Additional community membership check can be added here
      // For now, we'll allow authenticated users to view community posts
    }

    // Add post to request object for use in controllers
    req.post = post;
    next();
  } catch (error) {
    console.error("Error in checkPostAccess middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to check if user is post author or admin
export const checkPostOwnership = async (req, res, next) => {
  try {
    const post = req.post; // From checkPostAccess middleware
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author or admin
    const isAuthor = post.authorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action",
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkPostOwnership middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to check if user can moderate posts
export const checkModerationAccess = (req, res, next) => {
  try {
    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required for moderation",
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkModerationAccess middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to filter content based on user preferences
export const filterContentByPreferences = async (req, res, next) => {
  try {
    // This middleware can be used to filter content based on user preferences
    // For example, hiding certain types of content, flagged content, etc.
    
    if (!req.user) {
      // For non-authenticated users, only show public, non-flagged content
      req.query.visibility = "public";
      req.query["moderation.status"] = "ok";
    } else {
      // For authenticated users, you can add more sophisticated filtering
      // based on their preferences, blocked users, etc.
      
      // Example: Hide posts from blocked users (implement block system first)
      // Example: Show/hide certain content types based on preferences
    }

    next();
  } catch (error) {
    console.error("Error in filterContentByPreferences middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to validate media uploads
export const validateMediaUpload = (req, res, next) => {
  try {
    // Check if media files are being uploaded
    if (req.files && req.files.length > 0) {
      const maxFiles = 10;
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload more than ${maxFiles} files`,
        });
      }

      // Validate each file
      for (const file of req.files) {
        if (file.size > maxFileSize) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} exceeds maximum size of 10MB`,
          });
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type ${file.mimetype} is not allowed`,
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error in validateMediaUpload middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to sanitize content
export const sanitizeContent = (req, res, next) => {
  try {
    if (req.body.content) {
      // Basic content sanitization
      req.body.content = req.body.content.trim();
      
      // Remove excessive whitespace
      req.body.content = req.body.content.replace(/\s+/g, ' ');
      
      // You can add more sophisticated sanitization here
      // such as removing malicious scripts, inappropriate content, etc.
    }

    if (req.body.tags) {
      // Sanitize tags
      req.body.tags = req.body.tags.map(tag => 
        tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      ).filter(tag => tag.length > 0);
    }

    next();
  } catch (error) {
    console.error("Error in sanitizeContent middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to check post rate limiting
export const checkPostRateLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // Skip rate limiting for non-authenticated users
    }

    // Check how many posts the user has created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPostsCount = await Post.countDocuments({
      authorId: req.user._id,
      createdAt: { $gte: oneHourAgo },
    });

    const maxPostsPerHour = 10; // Adjust as needed

    if (recentPostsCount >= maxPostsPerHour) {
      return res.status(429).json({
        success: false,
        message: "Too many posts created recently. Please wait before creating another post.",
        retryAfter: 3600, // seconds
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkPostRateLimit middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Middleware to check if user can view flagged content
export const checkFlaggedContentAccess = async (req, res, next) => {
  try {
    const post = req.post; // From checkPostAccess middleware
    
    if (!post) {
      return next();
    }

    // If post is flagged, only allow author or admin to view it
    if (post.moderation.status === "flagged") {
      const isAuthor = post.authorId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "This post is under review and not available for viewing",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in checkFlaggedContentAccess middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
