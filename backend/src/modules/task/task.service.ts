import { Task, Project } from "../../database/models";
import { UniqueConstraintError, Op } from "sequelize";
import { sequelize } from "../../config/database";

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
      throw new Error(
        "A task with this title already exists in this project."
      );
    }

    // The database now enforces UNIQUE(projectId, title).
    // The try/catch handles violations caused by concurrent requests
    // that could both pass the findOne() check.
    try {
      const task = await Task.create(taskData);
      return task;
    } catch (error) {
      // Handle a duplicate detected by the database-level unique constraint.
      if (error instanceof UniqueConstraintError) {
        throw new Error(
          "A task with this title already exists in this project."
        );
      }

      throw error;
    }
  }

  async getTasksByProject(userId: string, projectId: string, overdueOnly = false) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    const whereClause: any = { projectId };
    if (overdueOnly) {
      whereClause.dueDate = {
        [Op.lt]: new Date(),
      };
      whereClause.status = {
        [Op.ne]: "Done",
      };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(duration), 0)
              FROM time_entries AS te
              WHERE te."taskId" = "Task".id
            )`),
            "totalLoggedTime"
          ]
        ]
      },
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

    if (
      updateData.title &&
      updateData.title !== task.getDataValue("title")
    ) {
      const existing = await Task.findOne({
        where: {
          projectId: task.getDataValue("projectId"),
          title: updateData.title,
        },
      });

      if (existing) {
        throw new Error(
          "A task with this title already exists in this project."
        );
      }
    }

    // The database-level unique constraint also applies to updates.
    // Catch violations caused by concurrent requests changing task titles.
    try {
      await task.update(updateData);
      return task;
    } catch (error) {
      // Convert the database unique constraint violation into
      // the same application-level duplicate-title error.
      if (error instanceof UniqueConstraintError) {
        throw new Error(
          "A task with this title already exists in this project."
        );
      }

      throw error;
    }
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.getTaskByIdAndUser(taskId, userId);

    if (!task) {
      throw new Error("Task not found or access denied.");
    }

    await task.destroy();

    return {
      message: "Task deleted successfully",
    };
  }
}

export default new TaskService();