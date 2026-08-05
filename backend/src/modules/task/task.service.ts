import { Task, Project } from "../../database/models";

class TaskService {
  async createTask(userId: string, taskData: any) {
    const { projectId, title } = taskData;
    const project = await Project.findOne({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    const existing = await Task.findOne({
      where: { projectId, title },
    });
    if (existing) {
      throw new Error("A task with this title already exists in this project.");
    }

    const task = await Task.create(taskData);
    return task;
  }

  async getTasksByProject(userId: string, projectId: string) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    const tasks = await Task.findAll({
      where: { projectId },
      order: [["createdAt", "ASC"]],
    });
    return tasks;
  }

  async getTaskByIdAndUser(taskId: string, userId: string) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      return null;
    }

    const project = await Project.findOne({
      where: { id: task.getDataValue("projectId"), userId },
    });
    if (!project) {
      return null;
    }

    return task;
  }

  async updateTask(userId: string, taskId: string, updateData: any) {
    const task = await this.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new Error("Task not found or access denied.");
    }

    if (updateData.title && updateData.title !== task.getDataValue("title")) {
      const existing = await Task.findOne({
        where: { projectId: task.getDataValue("projectId"), title: updateData.title },
      });
      if (existing) {
        throw new Error("A task with this title already exists in this project.");
      }
    }

    await task.update(updateData);
    return task;
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new Error("Task not found or access denied.");
    }

    await task.destroy();
    return { message: "Task deleted successfully" };
  }
}

export default new TaskService();
