const express = require("express");

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();

app.use(express.json());

app.use(userRoutes);
app.use(postRoutes);
app.use(commentRoutes);

module.exports = app;
