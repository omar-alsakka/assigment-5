require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(express.json());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Part 1: Using Prisma define the following models:
// Users, Posts, and Comments are defined in prisma/schema.prisma.
// The password field is kept in the User model as required.
// Email format, password length, and name length validations are handled in the signup API below.
// Post soft delete is handled using deletedAt because Prisma does not have Sequelize paranoid.

// A- User APIs (2 Grades):
// 1. Create a new user. Make sure that the email does not exist before creating the user.
// URL: POST /users/signup
app.post("/users/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || name.length <= 2) {
      return res.status(400).json({ message: "Name must be greater than 2 characters." });
    }

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (!password || password.length <= 6) {
      return res.status(400).json({ message: "Password length must be greater than 6 characters." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
      },
    });

    res.status(201).json({ message: "User added successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// A- User APIs (2 Grades):
// 2. Create or update based on primary key and skip validation option.
// URL: PUT /users/:id
app.put("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password, role } = req.body;

  try {
    await prisma.user.upsert({
      where: { id },
      update: {
        name,
        email,
        password,
        role,
      },
      create: {
        id,
        name: name || "Updated Name",
        email: email || `user${id}@gmail.com`,
        password: password || "password123",
        role: role || "user",
      },
    });

    res.json({ message: "User created or updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// A- User APIs (2 Grades):
// 3. Write an API endpoint to find a user by their email address.
// URL: GET /users/by-email?email=user1@gmail.com
app.get("/users/by-email", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "no user found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// A- User APIs (2 Grades):
// 4. Retrieve a user by their primary key, excluding the role field from the response.
// URL: GET /user/:id
app.get("/user/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "no user found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// B- Post APIs (2 Grades):
// 1. Create new Post. Get the post data from the body.
// URL: POST /posts
app.post("/posts", async (req, res) => {
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
});

// B- Post APIs (2 Grades):
// 2. Delete a post by its id. Ensure that only the owner can perform this action.
// URL: DELETE /posts/:postId
app.delete("/posts/:postId", async (req, res) => {
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
});

// B- Post APIs (2 Grades):
// 3. Retrieve all posts including the user who created each post and associated comments.
// Show only id and title for post, id and name for user, and id and content for comments.
// URL: GET /posts/details
app.get("/posts/details", async (req, res) => {
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
});

// B- Post APIs (2 Grades):
// 4. Retrieve all posts and count the number of comments associated with each post.
// URL: GET /posts/comment-count
app.get("/posts/comment-count", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 1. Create a bulk of Comments.
// URL: POST /comments
app.post("/comments", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 2. Update the content of a specific comment by its id.
// Ensure that only the owner of the comment can perform this action.
// URL: PATCH /comments/:commentId
app.patch("/comments/:commentId", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 3. Find a comment for a specific post, user, and content.
// If the comment exists, return it. Otherwise, create a new comment.
// URL: POST /comments/find-or-create
app.post("/comments/find-or-create", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 4. Retrieve all comments that contain a specific word and return the number matched.
// URL: GET /comments/search?word=the
app.get("/comments/search", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 5. Retrieve the 3 most recent comments for a specific post, ordered by creation date.
// URL: GET /comments/newest/:postId
app.get("/comments/newest/:postId", async (req, res) => {
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
});

// C- Comment APIs (3 Grades):
// 6. Get Specific Comment By PK with User and Post Information.
// URL: GET /comments/details/:id
app.get("/comments/details/:id", async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
