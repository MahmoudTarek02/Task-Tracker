import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

// Enable CORS (Cross-Origin Resource Sharing) middleware.
// This allows the backend to accept API requests from other domains/ports (like the React frontend running on port 5173).
// Without CORS, browser security policies (Same-Origin Policy) would block frontend requests because the ports differ.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.send("TaskTrack API is running!");
});

export default app;