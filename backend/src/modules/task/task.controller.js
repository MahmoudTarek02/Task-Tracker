"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const task_service_1 = __importDefault(require("./task.service"));
const task_validation_1 = require("./task.validation");
class TaskController {
    async create(req, res) {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const result = task_validation_1.createTaskSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        try {
            const task = await task_service_1.default.createTask(authReq.user.id, result.data);
            return res.status(201).json({
                message: "Task created successfully",
                task,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to create task",
            });
        }
    }
    async list(req, res) {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const { projectId } = req.query;
        if (!projectId || typeof projectId !== "string") {
            return res.status(400).json({
                message: "projectId query parameter is required and must be a string",
            });
        }
        try {
            const tasks = await task_service_1.default.getTasksByProject(authReq.user.id, projectId);
            return res.status(200).json({
                tasks,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to fetch tasks",
            });
        }
    }
    async update(req, res) {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const id = req.params.id;
        const result = task_validation_1.updateTaskSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        try {
            const task = await task_service_1.default.updateTask(authReq.user.id, id, result.data);
            return res.status(200).json({
                message: "Task updated successfully",
                task,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to update task",
            });
        }
    }
    async delete(req, res) {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const id = req.params.id;
        try {
            const result = await task_service_1.default.deleteTask(authReq.user.id, id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to delete task",
            });
        }
    }
}
exports.default = new TaskController();
//# sourceMappingURL=task.controller.js.map