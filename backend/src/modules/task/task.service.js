"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../../database/models");
class TaskService {
    async createTask(userId, taskData) {
        const { projectId, title } = taskData;
        const project = await models_1.Project.findOne({
            where: { id: projectId, userId },
        });
        if (!project) {
            throw new Error("Project not found or access denied.");
        }
        const existing = await models_1.Task.findOne({
            where: { projectId, title },
        });
        if (existing) {
            throw new Error("A task with this title already exists in this project.");
        }
        const task = await models_1.Task.create(taskData);
        return task;
    }
    async getTasksByProject(userId, projectId) {
        const project = await models_1.Project.findOne({
            where: { id: projectId, userId },
        });
        if (!project) {
            throw new Error("Project not found or access denied.");
        }
        const tasks = await models_1.Task.findAll({
            where: { projectId },
            order: [["createdAt", "ASC"]],
        });
        return tasks;
    }
    async getTaskByIdAndUser(taskId, userId) {
        const task = await models_1.Task.findByPk(taskId);
        if (!task) {
            return null;
        }
        const project = await models_1.Project.findOne({
            where: { id: task.getDataValue("projectId"), userId },
        });
        if (!project) {
            return null;
        }
        return task;
    }
    async updateTask(userId, taskId, updateData) {
        const task = await this.getTaskByIdAndUser(taskId, userId);
        if (!task) {
            throw new Error("Task not found or access denied.");
        }
        if (updateData.title && updateData.title !== task.getDataValue("title")) {
            const existing = await models_1.Task.findOne({
                where: { projectId: task.getDataValue("projectId"), title: updateData.title },
            });
            if (existing) {
                throw new Error("A task with this title already exists in this project.");
            }
        }
        await task.update(updateData);
        return task;
    }
    async deleteTask(userId, taskId) {
        const task = await this.getTaskByIdAndUser(taskId, userId);
        if (!task) {
            throw new Error("Task not found or access denied.");
        }
        await task.destroy();
        return { message: "Task deleted successfully" };
    }
}
exports.default = new TaskService();
//# sourceMappingURL=task.service.js.map