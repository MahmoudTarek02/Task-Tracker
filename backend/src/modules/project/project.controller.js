"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const project_service_1 = __importDefault(require("./project.service"));
const project_validation_1 = require("./project.validation");
class ProjectController {
    async create(req, res) {
        const authReq = req;
        // user should be authenticated to create a project
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const result = project_validation_1.createProjectSchema.safeParse(req.body);
        if (!result.success) { // validation fail, which is implemented by Zod
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        const { name, description } = result.data;
        try {
            const project = await project_service_1.default.createProject(authReq.user.id, name, description);
            return res.status(201).json({
                message: "Project created successfully",
                project,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to create project",
            });
        }
    }
    async list(req, res) {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        try {
            const projects = await project_service_1.default.getProjectsByUser(authReq.user.id);
            return res.status(200).json({
                projects,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: error.message || "Failed to fetch projects",
            });
        }
    }
    async update(req, res) {
        const authReq = req;
        // user should be authenticated to update a project
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const id = req.params.id;
        const result = project_validation_1.updateProjectSchema.safeParse(req.body);
        if (!result.success) { // validation fail
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        try {
            const project = await project_service_1.default.updateProject(id, authReq.user.id, result.data);
            return res.status(200).json({
                message: "Project updated successfully",
                project,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to update project",
            });
        }
    }
    async delete(req, res) {
        const authReq = req;
        // user should be authenticated to delete a project
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const id = req.params.id;
        try {
            const result = await project_service_1.default.deleteProject(id, authReq.user.id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Failed to delete project",
            });
        }
    }
}
exports.default = new ProjectController();
//# sourceMappingURL=project.controller.js.map