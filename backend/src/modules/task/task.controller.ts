import { Request, Response } from "express";
import taskService from "./task.service";
import { createTaskSchema, updateTaskSchema } from "./task.validation";

class TaskController {
  async create(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = createTaskSchema.safeParse(req.body);
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
      const task = await taskService.createTask(authReq.user.id, result.data);
      return res.status(201).json({
        message: "Task created successfully",
        task,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to create task",
      });
    }
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { projectId, overdue } = req.query;
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        message: "projectId query parameter is required and must be a string",
      });
    }

    try {
      const overdueOnly = overdue === "true";
      const tasks = await taskService.getTasksByProject(authReq.user.id, projectId, overdueOnly);
      return res.status(200).json({
        tasks,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to fetch tasks",
      });
    }
  }

  async update(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    const result = updateTaskSchema.safeParse(req.body);
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
      const task = await taskService.updateTask(authReq.user.id, id, result.data);
      return res.status(200).json({
        message: "Task updated successfully",
        task,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to update task",
      });
    }
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    try {
      const result = await taskService.deleteTask(authReq.user.id, id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to delete task",
      });
    }
  }
}

export default new TaskController();
