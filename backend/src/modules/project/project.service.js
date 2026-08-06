"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../../database/models");
class ProjectService {
    async createProject(userId, name, description) {
        const existing = await models_1.Project.findOne({
            where: { userId, name },
        });
        if (existing) {
            throw new Error("A project with this name already exists.");
        }
        const project = await models_1.Project.create({
            name,
            description,
            userId,
        });
        return project;
    }
    async getProjectsByUser(userId) {
        const projects = await models_1.Project.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
        });
        return projects;
    }
    async getProjectByIdAndUser(projectId, userId) {
        const project = await models_1.Project.findOne({
            where: { id: projectId, userId },
        });
        return project;
    }
    async updateProject(projectId, userId, updateData) {
        const project = await this.getProjectByIdAndUser(projectId, userId);
        if (!project) {
            throw new Error("Project not found or access denied.");
        }
        if (updateData.name && updateData.name !== project.getDataValue("name")) {
            const existing = await models_1.Project.findOne({
                where: { userId, name: updateData.name },
            });
            if (existing) {
                throw new Error("A project with this name already exists.");
            }
        }
        await project.update(updateData);
        return project;
    }
    async deleteProject(projectId, userId) {
        const project = await this.getProjectByIdAndUser(projectId, userId);
        if (!project) {
            throw new Error("Project not found or access denied.");
        }
        await project.destroy();
        return { message: "Project deleted successfully" };
    }
}
exports.default = new ProjectService();
//# sourceMappingURL=project.service.js.map