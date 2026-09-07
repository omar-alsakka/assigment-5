const express = require("express");
const {
  createPost,
  deletePost,
  getPostsWithDetails,
  getPostsCommentCount,
} = require("../controllers/postController");

const router = express.Router();

router.post("/posts", createPost);
router.delete("/posts/:postId", deletePost);
router.get("/posts/details", getPostsWithDetails);
router.get("/posts/comment-count", getPostsCommentCount);

module.exports = router;
