const express = require("express");
const {
  createBulkComments,
  updateComment,
  findOrCreateComment,
  searchComments,
  getNewestCommentsForPost,
  getCommentDetails,
} = require("../controllers/commentController");

const router = express.Router();

router.post("/comments", createBulkComments);
router.post("/comments/find-or-create", findOrCreateComment);
router.get("/comments/search", searchComments);
router.get("/comments/newest/:postId", getNewestCommentsForPost);
router.get("/comments/details/:id", getCommentDetails);
router.patch("/comments/:commentId", updateComment);

module.exports = router;
