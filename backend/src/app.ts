import express from "express";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.send("TaskTrack API is running!");
});

export default app;