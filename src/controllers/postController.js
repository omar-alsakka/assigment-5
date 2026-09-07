const prisma = require("../config/prisma");

// B- Post APIs (2 Grades):
// 1. Create new Post. Get the post data from the body.
// URL: POST /posts
const createPost = async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    await prisma.post.create({
      data: {
        title,
        content,
        userId: Number(userId),
      },
    });

    res.status(201).json({ message: "Post created successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// B- Post APIs (2 Grades):
// 2. Delete a post by its id. Ensure that only the owner can perform this action.
// URL: DELETE /posts/:postId
const deletePost = async (req, res) => {
  const id = Number(req.params.postId);
  const userId = Number(req.body.userId);

  try {
    const post = await prisma.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this post." });
    }

    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: "Post deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// B- Post APIs (2 Grades):
// 3. Retrieve all posts including the user who created each post and associated comments.
// Show only id and title for post, id and name for user, and id and content for comments.
// URL: GET /posts/details
const getPostsWithDetails = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// B- Post APIs (2 Grades):
// 4. Retrieve all posts and count the number of comments associated with each post.
// URL: GET /posts/comment-count
const getPostsCommentCount = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const result = posts.map((post) => ({
      id: post.id,
      title: post.title,
      commentCount: post._count.comments,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPost,
  deletePost,
  getPostsWithDetails,
  getPostsCommentCount,
};
