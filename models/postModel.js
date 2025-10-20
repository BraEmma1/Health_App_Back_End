import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
    },
    
    type: {
      type: String,
      enum: ["text", "image", "video", "article", "question"],
      required: [true, "Post type is required"],
    },
    
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    
    media: [{
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["image", "video", "document"],
        required: true,
      },
      width: {
        type: Number,
        default: null,
      },
      height: {
        type: Number,
        default: null,
      },
      size: {
        type: Number, // in bytes
        default: null,
      },
    }],
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    }],
    
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community", // You'll need to create this model later
      default: null,
    },
    
    isVerifiedContent: {
      type: Boolean,
      default: false,
    },
    
    visibility: {
      type: String,
      enum: ["public", "private", "community"],
      default: "public",
    },
    
    eng: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      comments: {
        type: Number,
        default: 0,
        min: 0,
      },
      shares: {
        type: Number,
        default: 0,
        min: 0,
      },
      saves: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    moderation: {
      status: {
        type: String,
        enum: ["ok", "flagged", "removed"],
        default: "ok",
      },
      reason: {
        type: String,
        default: null,
      },
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      flaggedAt: {
        type: Date,
        default: null,
      },
    },
    
    // Additional fields for better functionality
    isActive: {
      type: Boolean,
      default: true,
    },
    
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // For question-type posts
    isAnswered: {
      type: Boolean,
      default: false,
    },
    
    // For article-type posts
    readingTime: {
      type: Number, // in minutes
      default: null,
    },
    
    // For better search and filtering
    searchKeywords: [{
      type: String,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ communityId: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ "moderation.status": 1 });
postSchema.index({ searchKeywords: 1 });

// Virtual for full engagement score
postSchema.virtual("totalEngagement").get(function () {
  return this.eng.likes + this.eng.comments + this.eng.shares + this.eng.saves;
});

// Pre-save middleware to update search keywords
postSchema.pre("save", function (next) {
  if (this.isModified("content") || this.isModified("tags")) {
    const keywords = [];
    
    // Add tags as keywords
    if (this.tags && this.tags.length > 0) {
      keywords.push(...this.tags);
    }
    
    // Extract hashtags from content
    const hashtagRegex = /#\w+/g;
    const hashtags = this.content.match(hashtagRegex);
    if (hashtags) {
      keywords.push(...hashtags.map(tag => tag.substring(1).toLowerCase()));
    }
    
    // Extract words from content (basic keyword extraction)
    const words = this.content.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Limit to 10 words
    
    keywords.push(...words);
    
    this.searchKeywords = [...new Set(keywords)]; // Remove duplicates
  }
  
  next();
});

// Static method to get posts by type
postSchema.statics.getPostsByType = function(type, limit = 20, skip = 0) {
  return this.find({ type, isActive: true })
    .populate("authorId", "firstName lastName profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get trending posts
postSchema.statics.getTrendingPosts = function(limit = 20, skip = 0) {
  return this.find({ 
    isActive: true, 
    visibility: "public",
    "moderation.status": "ok"
  })
    .populate("authorId", "firstName lastName profilePicture")
    .sort({ 
      "eng.likes": -1,
      "eng.comments": -1,
      createdAt: -1 
    })
    .limit(limit)
    .skip(skip);
};

// Instance method to increment engagement
postSchema.methods.incrementEngagement = function(type) {
  if (this.eng[type] !== undefined) {
    this.eng[type] += 1;
    return this.save();
  }
  throw new Error(`Invalid engagement type: ${type}`);
};

// Instance method to decrement engagement
postSchema.methods.decrementEngagement = function(type) {
  if (this.eng[type] !== undefined && this.eng[type] > 0) {
    this.eng[type] -= 1;
    return this.save();
  }
  throw new Error(`Invalid engagement type: ${type}`);
};

export const Post = mongoose.model("Post", postSchema);
