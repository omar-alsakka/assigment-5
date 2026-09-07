const express = require("express");
const {
  signup,
  createOrUpdate,
  getByEmail,
  getById,
} = require("../controllers/userController");

const router = express.Router();

router.post("/users/signup", signup);
router.put("/users/:id", createOrUpdate);
router.get("/users/by-email", getByEmail);
router.get("/user/:id", getById);

module.exports = router;
