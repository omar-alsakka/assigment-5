const prisma = require("../config/prisma");

// C- Comment APIs (3 Grades):
// 1. Create a bulk of Comments.
// URL: POST /comments
const createBulkComments = async (req, res) => {
  const { comments } = req.body;

  try {
    await prisma.comment.createMany({
      data: comments.map((comment) => ({
        content: comment.content,
        postId: Number(comment.postId),
        userId: Number(comment.userId),
      })),
    });

    res.status(201).json({ message: "comments created." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// C- Comment APIs (3 Grades):
// 2. Update the content of a specific comment by its id.
// Ensure that only the owner of the comment can perform this action.
// URL: PATCH /comments/:commentId
const updateComment = async (req, res) => {
  const id = Number(req.params.commentId);
  const userId = Number(req.body.userId);
  const { content } = req.body;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: "comment not found." });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this comment." });
    }

    await prisma.comment.update({
      where: { id },
      data: { content },
    });

    res.json({ message: "Comment updated." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// C- Comment APIs (3 Grades):
// 3. Find a comment for a specific post, user, and content.
// If the comment exists, return it. Otherwise, create a new comment.
// URL: POST /comments/find-or-create
const findOrCreateComment = async (req, res) => {
  const { postId, userId, content } = req.body;

  try {
    let comment = await prisma.comment.findFirst({
      where: {
        postId: Number(postId),
        userId: Number(userId),
        content,
      },
    });

    if (comment) {
      return res.json({ comment, created: false });
    }

    comment = await prisma.comment.create({
      data: {
        postId: Number(postId),
        userId: Number(userId),
        content,
      },
    });

    res.status(201).json({ comment, created: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// C- Comment APIs (3 Grades):
// 4. Retrieve all comments that contain a specific word and return the number matched.
// URL: GET /comments/search?word=the
const searchComments = async (req, res) => {
  const { word } = req.query;

  try {
    const comments = await prisma.comment.findMany({
      where: {
        content: {
          contains: word,
        },
      },
    });

    if (comments.length === 0) {
      return res.status(404).json({ message: "no comments found." });
    }

    res.json({ count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// C- Comment APIs (3 Grades):
// 5. Retrieve the 3 most recent comments for a specific post, ordered by creation date.
// URL: GET /comments/newest/:postId
const getNewestCommentsForPost = async (req, res) => {
  const postId = Number(req.params.postId);

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// C- Comment APIs (3 Grades):
// 6. Get Specific Comment By PK with User and Post Information.
// URL: GET /comments/details/:id
const getCommentDetails = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ message: "no comment found" });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBulkComments,
  updateComment,
  findOrCreateComment,
  searchComments,
  getNewestCommentsForPost,
  getCommentDetails,
};
