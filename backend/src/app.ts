import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import taskRoutes from "./modules/task/task.routes";
import timeEntryRoutes from "./modules/time-entry/time-entry.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser()); // to read the cookie from the incoming request
app.use(express.json()); // to parse JSON body of the incoming request
// each request will be logged with its method, url, status code, and duration
// this should be before all routes
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/time-entries", timeEntryRoutes);

app.get("/", (_req, res) => {
  res.send("TaskTrack API is running!");
});

app.use(errorHandler);

export default app;
