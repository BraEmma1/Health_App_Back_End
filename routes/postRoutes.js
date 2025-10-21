import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsByAuthor,
  getTrendingPosts,
  searchPosts,
  moderatePost,
  getPostsByType,
  getMyPosts,
} from "../controllers/postController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import {
  createPostValidation,
  updatePostValidation,
  getPostsQueryValidation,
  searchPostsValidation,
  moderatePostValidation,
  postIdValidation,
  userIdValidation,
  postTypeValidation,
  paginationValidation,
} from "../validation_schema/postValidation.js";

const postRouter = Router();

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Invalid data
 *   get:
 *     summary: Get all posts (with filters)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Author ID
 *         required: false
 *     responses:
 *       200:
 *         description: List of posts
 */
// Validation middleware function
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Query validation failed",
        errors: messages,
      });
    }
    next();
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Parameter validation failed",
        errors: messages,
      });
    }
    next();
  };
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// Post Routes

// Create a new post
postRouter.post(
  "/",
  authenticateUser,
  validate(createPostValidation),
  createPost
);

// Get all posts with filtering and pagination
postRouter.get(
  "/",
  validateQuery(getPostsQueryValidation),
  getAllPosts
);

/**
 * @swagger
 * /posts/trending:
 *   get:
 *     summary: Get trending posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of trending posts
 */
// Get trending posts
postRouter.get(
  "/trending",
  validateQuery(paginationValidation),
  getTrendingPosts
);

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Search posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term
 *         required: true
 *     responses:
 *       200:
 *         description: List of posts
 */
// Search posts
postRouter.get(
  "/search",
  validateQuery(searchPostsValidation),
  searchPosts
);

// Get posts by type
postRouter.get(
  "/type/:type",
  validateParams(postTypeValidation),
  validateQuery(paginationValidation),
  getPostsByType
);

// Get my posts (authenticated user's posts)
postRouter.get(
  "/my-posts",
  authenticateUser,
  validateQuery(paginationValidation),
  getMyPosts
);

// Get posts by specific author
postRouter.get(
  "/author/:authorId",
  validateParams(userIdValidation),
  validateQuery(paginationValidation),
  getPostsByAuthor
);

// Get a single post by ID
postRouter.get(
  "/:id",
  validateParams(postIdValidation),
  getPostById
);

// Update a post
postRouter.put(
  "/:id",
  authenticateUser,
  validateParams(postIdValidation),
  validate(updatePostValidation),
  updatePost
);

// Delete a post
postRouter.delete(
  "/:id",
  authenticateUser,
  validateParams(postIdValidation),
  deletePost
);

// Moderate a post (admin only)
postRouter.patch(
  "/:id/moderate",
  authenticateUser,
  requireAdmin,
  validateParams(postIdValidation),
  validate(moderatePostValidation),
  moderatePost
);

export { postRouter };
