import Joi from "joi";

// Media object validation
const mediaSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri": "Media URL must be a valid URI",
    "any.required": "Media URL is required",
  }),
  publicId: Joi.string().required().messages({
    "any.required": "Media public ID is required",
  }),
  type: Joi.string().valid("image", "video", "document").required().messages({
    "any.only": "Media type must be image, video, or document",
    "any.required": "Media type is required",
  }),
  width: Joi.number().integer().positive().optional(),
  height: Joi.number().integer().positive().optional(),
  size: Joi.number().integer().positive().optional(),
});

// Mention object validation
const mentionSchema = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid user ID format",
    "any.required": "User ID is required for mention",
  }),
  username: Joi.string().min(3).max(30).required().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required for mention",
  }),
});

// Create post validation
export const createPostValidation = Joi.object({
  type: Joi.string()
    .valid("text", "image", "video", "article", "question")
    .required()
    .messages({
      "any.only": "Post type must be text, image, video, article, or question",
      "any.required": "Post type is required",
    }),

  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.min": "Content cannot be empty",
      "string.max": "Content cannot exceed 5000 characters",
      "any.required": "Content is required",
    }),

  media: Joi.array()
    .items(mediaSchema)
    .max(10)
    .optional()
    .messages({
      "array.max": "Cannot upload more than 10 media files",
    }),

  tags: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .max(20)
    .optional()
    .messages({
      "array.max": "Cannot have more than 20 tags",
      "string.min": "Each tag must be at least 2 characters",
      "string.max": "Each tag cannot exceed 50 characters",
    }),

  mentions: Joi.array()
    .items(mentionSchema)
    .max(50)
    .optional()
    .messages({
      "array.max": "Cannot mention more than 50 users",
    }),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "Invalid community ID format",
    }),

  visibility: Joi.string()
    .valid("public", "private", "community")
    .default("public")
    .messages({
      "any.only": "Visibility must be public, private, or community",
    }),
});

// Update post validation
export const updatePostValidation = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .optional()
    .messages({
      "string.min": "Content cannot be empty",
      "string.max": "Content cannot exceed 5000 characters",
    }),

  media: Joi.array()
    .items(mediaSchema)
    .max(10)
    .optional()
    .messages({
      "array.max": "Cannot upload more than 10 media files",
    }),

  tags: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .max(20)
    .optional()
    .messages({
      "array.max": "Cannot have more than 20 tags",
      "string.min": "Each tag must be at least 2 characters",
      "string.max": "Each tag cannot exceed 50 characters",
    }),

  mentions: Joi.array()
    .items(mentionSchema)
    .max(50)
    .optional()
    .messages({
      "array.max": "Cannot mention more than 50 users",
    }),

  visibility: Joi.string()
    .valid("public", "private", "community")
    .optional()
    .messages({
      "any.only": "Visibility must be public, private, or community",
    }),
});

// Get posts query validation
export const getPostsQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  type: Joi.string()
    .valid("text", "image", "video", "article", "question")
    .optional()
    .messages({
      "any.only": "Invalid post type",
    }),

  communityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid community ID format",
    }),

  authorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid author ID format",
    }),

  visibility: Joi.string()
    .valid("public", "private", "community")
    .optional()
    .messages({
      "any.only": "Invalid visibility value",
    }),

  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "viewCount", "totalEngagement")
    .default("createdAt")
    .messages({
      "any.only": "Invalid sort field",
    }),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .messages({
      "any.only": "Sort order must be asc or desc",
    }),
});

// Search posts validation
export const searchPostsValidation = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.min": "Search query cannot be empty",
      "string.max": "Search query cannot exceed 100 characters",
      "any.required": "Search query is required",
    }),

  type: Joi.string()
    .valid("text", "image", "video", "article", "question")
    .optional()
    .messages({
      "any.only": "Invalid post type",
    }),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

// Moderate post validation
export const moderatePostValidation = Joi.object({
  status: Joi.string()
    .valid("ok", "flagged", "removed")
    .required()
    .messages({
      "any.only": "Status must be ok, flagged, or removed",
      "any.required": "Moderation status is required",
    }),

  reason: Joi.string()
    .min(10)
    .max(500)
    .when("status", {
      is: Joi.string().valid("flagged", "removed"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.min": "Reason must be at least 10 characters",
      "string.max": "Reason cannot exceed 500 characters",
      "any.required": "Reason is required for flagged or removed posts",
    }),
});

// Pagination validation (reusable)
export const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  skip: Joi.number().integer().min(0).default(0).messages({
    "number.min": "Skip must be at least 0",
  }),
});

// Post ID validation
export const postIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid post ID format",
      "any.required": "Post ID is required",
    }),
});

// User ID validation
export const userIdValidation = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
});

// Post type validation
export const postTypeValidation = Joi.object({
  type: Joi.string()
    .valid("text", "image", "video", "article", "question")
    .required()
    .messages({
      "any.only": "Post type must be text, image, video, article, or question",
      "any.required": "Post type is required",
    }),
});
