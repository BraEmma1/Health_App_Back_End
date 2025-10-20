# Post API Documentation

This documentation covers the Post API endpoints for the Ditechted Health App backend.

## Post Model Structure

```javascript
{
  _id: ObjectId,
  authorId: ObjectId -> users,
  type: 'text'|'image'|'video'|'article'|'question',
  content: String, // text content
  media: [{ url, publicId, type, width, height, size }],
  tags: [String], // hashtags
  mentions: [{ userId, username }],
  communityId: ObjectId | null,
  isVerifiedContent: Boolean, // flagged if content originates from verified medical source
  visibility: 'public'|'private'|'community',
  eng: { likes: Number, comments: Number, shares: Number, saves: Number },
  moderation: { status: 'ok'|'flagged'|'removed', reason, flaggedBy, flaggedAt },
  createdAt, updatedAt
}
```

## API Endpoints

### Base URL: `/api/posts`

---

## 1. Create a New Post

**POST** `/api/posts`

**Authentication:** Required

**Request Body:**
```json
{
  "type": "text|image|video|article|question",
  "content": "Post content here",
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "publicId": "cloudinary_public_id",
      "type": "image|video|document",
      "width": 1920,
      "height": 1080,
      "size": 1024000
    }
  ],
  "tags": ["health", "wellness", "medicine"],
  "mentions": [
    {
      "userId": "user_id_here",
      "username": "username_here"
    }
  ],
  "communityId": "community_id_here_or_null",
  "visibility": "public|private|community"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "_id": "post_id",
    "authorId": "user_id",
    "type": "text",
    "content": "Post content here",
    // ... other fields
  }
}
```

---

## 2. Get All Posts

**GET** `/api/posts`

**Authentication:** Optional

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20, max: 100) - Number of posts per page
- `type` (string) - Filter by post type
- `communityId` (string) - Filter by community
- `authorId` (string) - Filter by author
- `visibility` (string) - Filter by visibility
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort order

**Response:**
```json
{
  "success": true,
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalPosts": 200,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 3. Get Trending Posts

**GET** `/api/posts/trending`

**Authentication:** Optional

**Query Parameters:**
- `limit` (number, default: 20) - Number of posts
- `skip` (number, default: 0) - Number of posts to skip

**Response:**
```json
{
  "success": true,
  "posts": [...]
}
```

---

## 4. Search Posts

**GET** `/api/posts/search`

**Authentication:** Optional

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string) - Filter by post type
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Posts per page

**Response:**
```json
{
  "success": true,
  "posts": [...],
  "totalPosts": 50,
  "currentPage": 1,
  "totalPages": 3
}
```

---

## 5. Get Posts by Type

**GET** `/api/posts/type/:type`

**Authentication:** Optional

**Path Parameters:**
- `type` (string) - Post type (text|image|video|article|question)

**Query Parameters:**
- `limit` (number, default: 20) - Number of posts
- `skip` (number, default: 0) - Number of posts to skip

---

## 6. Get My Posts

**GET** `/api/posts/my-posts`

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Posts per page
- `type` (string) - Filter by post type

---

## 7. Get Posts by Author

**GET** `/api/posts/author/:authorId`

**Authentication:** Optional

**Path Parameters:**
- `authorId` (string) - Author's user ID

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Posts per page
- `type` (string) - Filter by post type

---

## 8. Get Single Post

**GET** `/api/posts/:id`

**Authentication:** Optional (required for private posts)

**Path Parameters:**
- `id` (string) - Post ID

**Response:**
```json
{
  "success": true,
  "post": {
    "_id": "post_id",
    "authorId": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "profile_pic_url"
    },
    // ... other fields
  }
}
```

---

## 9. Update Post

**PUT** `/api/posts/:id`

**Authentication:** Required (author or admin only)

**Path Parameters:**
- `id` (string) - Post ID

**Request Body:**
```json
{
  "content": "Updated content",
  "media": [...],
  "tags": [...],
  "mentions": [...],
  "visibility": "public|private|community"
}
```

---

## 10. Delete Post

**DELETE** `/api/posts/:id`

**Authentication:** Required (author or admin only)

**Path Parameters:**
- `id` (string) - Post ID

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 11. Moderate Post

**PATCH** `/api/posts/:id/moderate`

**Authentication:** Required (admin only)

**Path Parameters:**
- `id` (string) - Post ID

**Request Body:**
```json
{
  "status": "ok|flagged|removed",
  "reason": "Reason for moderation (required for flagged/removed)"
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages"] // For validation errors
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

---

## Usage Examples

### Creating a Text Post
```bash
curl -X POST /api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "text",
    "content": "Hello, this is my first post!",
    "tags": ["introduction", "hello"],
    "visibility": "public"
  }'
```

### Creating an Image Post
```bash
curl -X POST /api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "image",
    "content": "Check out this amazing sunset!",
    "media": [
      {
        "url": "https://example.com/sunset.jpg",
        "publicId": "sunset_123",
        "type": "image",
        "width": 1920,
        "height": 1080,
        "size": 2048000
      }
    ],
    "tags": ["sunset", "nature", "photography"],
    "visibility": "public"
  }'
```

### Getting Posts with Pagination
```bash
curl -X GET "/api/posts?page=1&limit=10&type=text&sortBy=createdAt&sortOrder=desc"
```

### Searching Posts
```bash
curl -X GET "/api/posts/search?q=health&type=article&page=1&limit=20"
```

---

## Features Implemented

1. **CRUD Operations** - Full Create, Read, Update, Delete functionality
2. **Pagination** - Efficient pagination for large datasets
3. **Filtering** - Filter by type, author, community, visibility
4. **Search** - Text-based search across content, tags, and keywords
5. **Validation** - Comprehensive input validation using Joi
6. **Authentication** - JWT-based authentication
7. **Authorization** - Role-based access control
8. **Moderation** - Content moderation system
9. **Rate Limiting** - Prevents spam posting
10. **Media Support** - Support for images, videos, and documents
11. **Engagement Tracking** - Likes, comments, shares, saves
12. **Privacy Controls** - Public, private, and community visibility
13. **Mentions** - User mention system
14. **Hashtags** - Tag-based content organization

---

## Security Features

1. **Input Sanitization** - Content sanitization to prevent XSS
2. **File Upload Validation** - Validates file types and sizes
3. **Rate Limiting** - Prevents abuse
4. **Access Control** - Proper authorization checks
5. **Content Moderation** - Flagging and removal system
6. **Private Content** - Visibility controls

---

## Database Indexes

The Post model includes optimized indexes for:
- Author and creation date queries
- Type-based filtering
- Tag searches
- Community posts
- Visibility filtering
- Moderation status
- Search keywords

This ensures efficient query performance even with large datasets.
