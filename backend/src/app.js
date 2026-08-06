"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const project_routes_1 = __importDefault(require("./modules/project/project.routes"));
const task_routes_1 = __importDefault(require("./modules/task/task.routes"));
const app = (0, express_1.default)();
// Enable CORS (Cross-Origin Resource Sharing) middleware.
// This allows the backend to accept API requests from other domains/ports (like the React frontend running on port 5173).
// Without CORS, browser security policies (Same-Origin Policy) would block frontend requests because the ports differ.
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/projects", project_routes_1.default);
app.use("/tasks", task_routes_1.default);
app.get("/", (_req, res) => {
    res.send("TaskTrack API is running!");
});
exports.default = app;
//# sourceMappingURL=app.js.map