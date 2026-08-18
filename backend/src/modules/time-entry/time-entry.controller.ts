import { Request, Response } from "express";
import timeEntryService from "./time-entry.service";
import { createTimeEntrySchema, updateTimeEntrySchema } from "./time-entry.validation";

class TimeEntryController {
  async create(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const taskId = req.params.taskId as string;
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    const result = createTimeEntrySchema.safeParse(req.body);
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
      const timeEntry = await timeEntryService.createTimeEntry(
        authReq.user.id,
        taskId,
        result.data
      );

      return res.status(201).json({
        message: "Time entry created successfully",
        timeEntry,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to create time entry",
      });
    }
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const taskId = req.params.taskId as string;
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    try {
      const stats = await timeEntryService.getTimeEntriesForTask(
        authReq.user.id,
        taskId
      );

      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to fetch time entries",
      });
    }
  }

  async update(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: "Time entry ID is required" });
    }

    const result = updateTimeEntrySchema.safeParse(req.body);
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
      const timeEntry = await timeEntryService.updateTimeEntry(
        authReq.user.id,
        id,
        result.data
      );

      return res.status(200).json({
        message: "Time entry updated successfully",
        timeEntry,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to update time entry",
      });
    }
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: "Time entry ID is required" });
    }

    try {
      const result = await timeEntryService.deleteTimeEntry(
        authReq.user.id,
        id
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to delete time entry",
      });
    }
  }
}

export default new TimeEntryController();
