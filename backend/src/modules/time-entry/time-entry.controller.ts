import { Request, Response } from "express";
import timeEntryService from "./time-entry.service";

class TimeEntryController {
  async create(req: Request, res: Response) {
    const authReq = req as any;
    const taskId = req.params.taskId as string;
    const timeEntry = await timeEntryService.createTimeEntry(
      authReq.user.id,
      taskId,
      req.body
    );
    return res.status(201).json({
      message: "Time entry created successfully",
      timeEntry,
    });
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;
    const taskId = req.params.taskId as string;
    const stats = await timeEntryService.getTimeEntriesForTask(
      authReq.user.id,
      taskId
    );
    return res.status(200).json(stats);
  }

  async update(req: Request, res: Response) {
    const authReq = req as any;
    const id = req.params.id as string;
    const timeEntry = await timeEntryService.updateTimeEntry(
      authReq.user.id,
      id,
      req.body
    );
    return res.status(200).json({
      message: "Time entry updated successfully",
      timeEntry,
    });
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;
    const id = req.params.id as string;
    const result = await timeEntryService.deleteTimeEntry(
      authReq.user.id,
      id
    );
    return res.status(200).json(result);
  }
}

export default new TimeEntryController();
