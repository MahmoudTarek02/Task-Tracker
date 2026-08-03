import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Temporary test route
app.get("/", (_req, res) => {
  res.send("TaskTrack API is running!");
});

export default app;