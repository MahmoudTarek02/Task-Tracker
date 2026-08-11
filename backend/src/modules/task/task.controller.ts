import { Request, Response } from "express";
import taskService from "./task.service";

class TaskController {
  async create(req: Request, res: Response) {
    const authReq = req as any;
    const task = await taskService.createTask(authReq.user.id, req.body);

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;

    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { projectId, search, status, priority, overdue } = req.query as any;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        message: "projectId query parameter is required and must be a string",
      });
    }

    const filters: any = {};

    if (typeof search === "string" && search.trim() !== "") {
      filters.search = search.trim();
    }

    if (typeof status === "string" && status.trim() !== "") {
      filters.status = status.trim();
    }

    if (typeof priority === "string" && priority.trim() !== "") {
      filters.priority = priority.trim();
    }

    if (overdue === "true") {
      filters.overdue = true;
    }

    try {
      const tasks = await taskService.getTasksByProject(
        authReq.user.id,
        projectId,
        filters
      );

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
    const id = req.params.id as string;

    const task = await taskService.updateTask(
      authReq.user.id,
      id,
      req.body
    );

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;
    const id = req.params.id as string;

    const result = await taskService.deleteTask(
      authReq.user.id,
      id
    );

    return res.status(200).json(result);
  }
}

export default new TaskController();