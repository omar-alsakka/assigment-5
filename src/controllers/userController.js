const prisma = require("../config/prisma");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A- User APIs (2 Grades):
// 1. Create a new user. Make sure that the email does not exist before creating the user.
// URL: POST /users/signup
const signup = async (req, res) => {
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
};

// A- User APIs (2 Grades):
// 2. Create or update based on primary key and skip validation option.
// URL: PUT /users/:id
const createOrUpdate = async (req, res) => {
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
};

// A- User APIs (2 Grades):
// 3. Write an API endpoint to find a user by their email address.
// URL: GET /users/by-email?email=user1@gmail.com
const getByEmail = async (req, res) => {
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
};

// A- User APIs (2 Grades):
// 4. Retrieve a user by their primary key, excluding the role field from the response.
// URL: GET /user/:id
const getById = async (req, res) => {
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
};

module.exports = {
  signup,
  createOrUpdate,
  getByEmail,
  getById,
};
