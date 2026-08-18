import { describe, it, expect, vi, beforeEach } from "vitest";
import taskService from "../modules/task/task.service";
import { Task, Project, TaskAuditLog } from "../database/models";
import { NotFoundError, ConflictError } from "../utils/errors";
import { UniqueConstraintError, Op } from "sequelize";

describe("TaskService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createTask", () => {
    it("should successfully create a task and log audit history", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123", userId: "u123" } as any);
      vi.spyOn(Task, "findOne").mockResolvedValue(null);

      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "id") return "t123";
          return null;
        }),
      };
      vi.spyOn(Task, "create").mockResolvedValue(mockTask as any);

      // we don't care about the return value of TaskAuditLog.create, we only care that it was called
      vi.spyOn(TaskAuditLog, "create").mockResolvedValue({} as any);

      const taskData = { projectId: "p123", title: "New Task", description: "Task desc" };
      const result = await taskService.createTask("u123", taskData);

      expect(Project.findOne).toHaveBeenCalled();
      expect(Task.findOne).toHaveBeenCalled();
      // checks if task is created with the exact same data that was passed in 
      expect(Task.create).toHaveBeenCalledWith(taskData);
      expect(TaskAuditLog.create).toHaveBeenCalledWith({
        taskId: "t123",
        userId: "u123",
        action: "create",
      });
      // checks if the same mockTask that was created is returned
      expect(result).toBe(mockTask);
    });

    // Project.findOne returns null (not found or access denied)
    it("should throw NotFoundError if parent project not found or access denied", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue(null);

      await expect(
        taskService.createTask("u123", { projectId: "p123", title: "New Task" })
      ).rejects.toThrow(new NotFoundError("Project not found or access denied."));
    });

    // Project.findOne returns a project 
    // Task.findOne returns a task with the same title
    // application-level check fails
    it("should throw ConflictError if task title already exists in the project", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(Task, "findOne").mockResolvedValue({ id: "t-existing" } as any);

      await expect(
        taskService.createTask("u123", { projectId: "p123", title: "Duplicate Title" })
      ).rejects.toThrow(new ConflictError("A task with this title already exists in this project."));
    });

    // Project.findOne returns a project 
    // Task.findOne returns null (application-level passed)
    // Task.create throws a unique constraint error (database constraint is violated)
    it("should handle unique constraint error from database", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(Task, "findOne").mockResolvedValue(null);

      const dbError = new UniqueConstraintError({
        message: "Unique constraint error",
        errors: [],
      });
      vi.spyOn(Task, "create").mockRejectedValue(dbError);

      await expect(
        taskService.createTask("u123", { projectId: "p123", title: "Duplicate Title" })
      ).rejects.toThrow();
    });
  });

  describe("getTasksByProject", () => {
    it("should return tasks with search, status, priority, and overdue filters", async () => {
      // normally return a project id
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      // return tasks for that project
      const mockTasks = [{ id: "t1", title: "T1" }, { id: "t2", title: "T2" }];
      vi.spyOn(Task, "findAll").mockResolvedValue(mockTasks as any);

      const filters = {
        search: "keyword",
        status: "In Progress",
        priority: "High",
        overdue: true,
      };
      const result = await taskService.getTasksByProject("u123", "p123", filters);

      // check if Project.findOne was called
      expect(Project.findOne).toHaveBeenCalled();
      // check if Task.findAll was called with the correct filters
      expect(Task.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ // The argument must contain these properties, but it can contain other properties too.
            projectId: "p123", // check if project id is as expected
            priority: "High", // check if priority is as expected
            // search: builds an Op.or with iLike on title/description
            [Op.or]: [ // check if title has keyword or description has keyword
              { title: { [Op.iLike]: "%keyword%" } }, 
              { description: { [Op.iLike]: "%keyword%" } }, 
            ],
            // overdue: true overwrites status with { [Op.ne]: "Done" }, NOT "In Progress"
            status: { [Op.ne]: "Done" }, 
            dueDate: { [Op.lt]: expect.any(Date) },
          }),
        })
      );;
      expect(result).toEqual(mockTasks);
    });

    it("should throw NotFoundError if project is not found", async () => {
      // don't return a project
      vi.spyOn(Project, "findOne").mockResolvedValue(null);

      await expect(
        taskService.getTasksByProject("u123", "p123")
      ).rejects.toThrow(new NotFoundError("Project not found or access denied."));
    });
  });

  describe("updateTask", () => {
    it("should update task and write audit log entries for modified fields", async () => {
      const mockTask = {
        getDataValue: vi.fn((key) => {
          if (key === "id") return "t123";
          if (key === "projectId") return "p123";
          if (key === "title") return "Old Title";
          if (key === "status") return "To Do";
          return null;
        }),
        update: vi.fn().mockResolvedValue(undefined),
      };
      // when getTaskByIdAndUser is called, return the mock task
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      // when Project.findOne is called, return a project id
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      // when Task.findOne is called, return null (so no duplicate title exists)
      vi.spyOn(Task, "findOne").mockResolvedValue(null);
      // when TaskAuditLog.bulkCreate is called, return an empty array
      vi.spyOn(TaskAuditLog, "bulkCreate").mockResolvedValue([] as any);

      const updateData = { title: "New Title", status: "In Progress" };
      const result = await taskService.updateTask("u123", "t123", updateData);

      expect(mockTask.update).toHaveBeenCalledWith(updateData);
      expect(TaskAuditLog.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          fieldName: "title",
          oldValue: "Old Title",
          newValue: "New Title",
        }),
        expect.objectContaining({
          fieldName: "status",
          oldValue: "To Do",
          newValue: "In Progress",
        }),
      ]);
      expect(result).toBe(mockTask);
    });

    it("should throw NotFoundError if task is not found", async () => {
      vi.spyOn(Task, "findByPk").mockResolvedValue(null);

      await expect(
        taskService.updateTask("u123", "t123", { title: "Title" })
      ).rejects.toThrow(new NotFoundError("Task not found or access denied."));
    });

    it("should throw ConflictError if task title is changed to a title already existing in project", async () => {
      const mockTask = {
        getDataValue: vi.fn((key) => {
          if (key === "id") return "t123";
          if (key === "projectId") return "p123";
          if (key === "title") return "Old Title";
          return null;
        }),
      };

      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(Task, "findOne").mockResolvedValue({ id: "t-other" } as any); // duplicate title exists

      await expect(
        taskService.updateTask("u123", "t123", { title: "New Title" })
      ).rejects.toThrow(new ConflictError("A task with this title already exists in this project."));
    });

    // Task.findByPk finds the task, Project.findOne finds the project (access granted),
    // Task.update throws a unique constraint error (database constraint is violated)
    it("should handle unique constraint error from database during update", async () => {
      const mockTask = {
        getDataValue: vi.fn((key) => {
          if (key === "id") return "t123";
          if (key === "projectId") return "p123";
          if (key === "title") return "Old Title";
          return null;
        }),
        update: vi.fn().mockRejectedValue(new UniqueConstraintError({
          message: "Unique constraint error",
          errors: [],
        })),
      };

      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(Task, "findOne").mockResolvedValue(null);

      await expect(
        taskService.updateTask("u123", "t123", { title: "Duplicate Title" })
      ).rejects.toThrow();
    });
  });

  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      const mockTask = {
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      const result = await taskService.deleteTask("u123", "t123");

      expect(mockTask.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: "Task deleted successfully" });
    });

    // Task.findByPk returns null (not found or access denied) => throws NotFoundError
    it("should throw NotFoundError if task does not exist", async () => {
      vi.spyOn(Task, "findByPk").mockResolvedValue(null);

      await expect(
        taskService.deleteTask("u123", "t123")
      ).rejects.toThrow(new NotFoundError("Task not found or access denied."));
    });
  });

  describe("getTaskHistory", () => {
    it("should return history audit logs for a task", async () => {
      const mockTask = {
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      const mockHistory = [{ id: "h1", action: "create" }];
      vi.spyOn(TaskAuditLog, "findAll").mockResolvedValue(mockHistory as any);

      const result = await taskService.getTaskHistory("u123", "t123");

      expect(TaskAuditLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: "t123" },
        })
      );
      expect(result).toEqual(mockHistory);
    });
  });
});
