import { TimeEntry, Task, Project, TaskAuditLog } from "../../database/models";
import { NotFoundError } from "../../utils/errors";

class TimeEntryService {
  // checks if user has access to the task
  private async verifyTaskAccess(taskId: string, userId: string): Promise<Task> {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError("Task not found or access denied.");
    }

    const project = await Project.findOne({
      where: { id: task.getDataValue("projectId"), userId },
    });
    if (!project) {
      throw new NotFoundError("Task not found or access denied.");
    }

    return task;
  }

  private async verifyEntryAccess(entryId: string, userId: string): Promise<TimeEntry> {
    const entry = await TimeEntry.findByPk(entryId);
    if (!entry) {
      throw new NotFoundError("Time entry not found or access denied.");
    }

    const task = await Task.findByPk(entry.getDataValue("taskId"));
    if (!task) {
      throw new NotFoundError("Associated task not found.");
    }

    const project = await Project.findOne({
      where: { id: task.getDataValue("projectId"), userId },
    });
    if (!project) {
      throw new NotFoundError("Time entry not found or access denied.");
    }

    return entry;
  }

  async createTimeEntry(userId: string, taskId: string, data: any) {
    await this.verifyTaskAccess(taskId, userId);

    const timeEntry = await TimeEntry.create({
      taskId,
      duration: data.duration,
      date: data.date,
      note: data.note || null,
    });

    await TaskAuditLog.create({
      taskId,
      userId,
      action: "time_entry_create",
      newValue: JSON.stringify({
        duration: timeEntry.getDataValue("duration"),
        date: timeEntry.getDataValue("date"),
        note: timeEntry.getDataValue("note"),
      }),
    });

    return timeEntry;
  }

  // returns time entries for a specific task
  async getTimeEntriesForTask(userId: string, taskId: string) {
    // checks if user has access to the task
    // if below function throw error, it will be caught by global error handler
    // function execution stops there and error message is sent to the client
    const task = await this.verifyTaskAccess(taskId, userId);

    // fetching all time entries for the task
    // order by date descending and then by creation time descending
    const timeEntries = await TimeEntry.findAll({
      where: { taskId },
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    // fetching total logged time
    // using reduce to sum up all the time entries
    // and also to remove the responsibility for the frontend to do this calculation
    const totalLoggedTime = timeEntries.reduce(
      (sum, entry) => sum + Number(entry.getDataValue("duration")),
      0
    );

    // get estimated time from task
    const estimatedTime = task.getDataValue("estimatedTime");
    let remainingTime = null;
    let overrunTime = null;

    // if estimated time is not null or undefined
    if (estimatedTime !== undefined && estimatedTime !== null) {
      // if total logged time is greater than estimated time
      if (totalLoggedTime > estimatedTime) {
        overrunTime = totalLoggedTime - estimatedTime;
        remainingTime = 0;
      } else {
        remainingTime = estimatedTime - totalLoggedTime;
        overrunTime = 0;
      }
    }

    // returns time entries for a specific task along with total logged time, remaining time and overrun time
    // this returns will be displayed directly on the frontend
    // so no need to do any calculation on the frontend
    return {
      timeEntries,
      totalLoggedTime,
      remainingTime,
      overrunTime,
    };
  }

  async updateTimeEntry(userId: string, entryId: string, data: any) {
    const entry = await this.verifyEntryAccess(entryId, userId);

    const oldDuration = entry.getDataValue("duration");
    const oldDate = entry.getDataValue("date");
    const oldNote = entry.getDataValue("note");

    await entry.update({
      duration: data.duration !== undefined ? data.duration : entry.getDataValue("duration"),
      date: data.date !== undefined ? data.date : entry.getDataValue("date"),
      note: data.note !== undefined ? data.note : entry.getDataValue("note"),
    });

    await TaskAuditLog.create({
      taskId: entry.getDataValue("taskId"),
      userId,
      action: "time_entry_update",
      oldValue: JSON.stringify({
        duration: oldDuration,
        date: oldDate,
        note: oldNote,
      }),
      newValue: JSON.stringify({
        duration: entry.getDataValue("duration"),
        date: entry.getDataValue("date"),
        note: entry.getDataValue("note"),
      }),
    });

    return entry;
  }

  async deleteTimeEntry(userId: string, entryId: string) {
    const entry = await this.verifyEntryAccess(entryId, userId);
    const taskId = entry.getDataValue("taskId");
    const duration = entry.getDataValue("duration");
    const date = entry.getDataValue("date");
    const note = entry.getDataValue("note");

    await entry.destroy();

    await TaskAuditLog.create({
      taskId,
      userId,
      action: "time_entry_delete",
      oldValue: JSON.stringify({
        duration,
        date,
        note,
      }),
    });

    return { message: "Time entry deleted successfully" };
  }
}

export default new TimeEntryService();
