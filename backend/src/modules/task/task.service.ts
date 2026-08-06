import { Task, Project, TaskAuditLog, User } from "../../database/models";
import { Op } from "sequelize";
import { sequelize } from "../../config/database";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { UniqueConstraintError } from "sequelize";

class TaskService {
  async createTask(userId: string, taskData: any) {
    const { projectId, title } = taskData;

    const project = await Project.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundError("Project not found or access denied.");
    }

    const existing = await Task.findOne({
      where: { projectId, title },
    });

    if (existing) {
      throw new ConflictError("A task with this title already exists in this project.");
    }

    // The database now enforces UNIQUE(projectId, title).
    // The try/catch handles violations caused by concurrent requests
    // that could both pass the findOne() check.
    try {
      const task = await Task.create(taskData);
      await TaskAuditLog.create({
        taskId: task.getDataValue("id"),
        userId,
        action: "create",
      });
      return task;
    } catch (error) {
      // Handle a duplicate detected by the database-level unique constraint.
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError(
          "A task with this title already exists in this project."
        );
      }

      throw error;
    }
  }

  async getTasksByProject(
    userId: string,
    projectId: string,
    filters: {
      search?: string;
      status?: string;
      priority?: string;
      overdue?: boolean;
    } = {}
  ) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundError("Project not found or access denied.");
    }

    const whereClause: any = { projectId };

    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.overdue) {
      whereClause.dueDate = {
        [Op.lt]: new Date(),
      };
      whereClause.status = {
        // if overdone is true in filters, the status filter will become [Op.ne]: "Done", 
        // meaning the tasks that are not done will be returned, regardless of the status filter is in the search query
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
    // search for project with same id and project owner id is the current user id
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
      throw new NotFoundError("Task not found or access denied.");
    }

    // check if new title is different from old title
    // if so, check if a task with the new title already exists in the project
    // if so, throw conflict error
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
        throw new ConflictError("A task with this title already exists in this project.");
      }
    }

    const fieldsToCheck = ["title", "description", "priority", "estimatedTime", "dueDate", "status"];
    const auditEntries = [];

    for (const field of fieldsToCheck) {
      if (updateData[field] !== undefined) {
        const oldValue = task.getDataValue(field);
        const newValue = updateData[field];

        let isChanged = false;
        if (field === "dueDate") {
          const oldTime = oldValue ? new Date(oldValue).getTime() : null;
          const newTime = newValue ? new Date(newValue).getTime() : null;
          isChanged = oldTime !== newTime;
        } else {
          isChanged = String(oldValue ?? "") !== String(newValue ?? "");
        }

        if (isChanged) {
          auditEntries.push({
            taskId: task.getDataValue("id"),
            userId,
            action: "update",
            fieldName: field,
            oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
            newValue: newValue !== null && newValue !== undefined ? String(newValue) : null,
          });
        }
      }
    }

    // The database-level unique constraint also applies to updates.
    // Catch violations caused by concurrent requests changing task titles.
    try {
      await task.update(updateData);
      if (auditEntries.length > 0) {
        await TaskAuditLog.bulkCreate(auditEntries);
      }
      return task;
    } catch (error) {
      // Convert the database unique constraint violation into
      // the same application-level duplicate-title error.
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError(
          "A task with this title already exists in this project."
        );
      }

      throw error;
    }
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.getTaskByIdAndUser(taskId, userId);

    if (!task) {
      throw new NotFoundError("Task not found or access denied.");
    }

    await task.destroy();

    return {
      message: "Task deleted successfully",
    };
  }

  async getTaskHistory(userId: string, taskId: string) {
    const task = await this.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new NotFoundError("Task not found or access denied.");
    }

    const history = await TaskAuditLog.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return history;
  }
}

export default new TaskService();