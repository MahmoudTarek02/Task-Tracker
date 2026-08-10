import { TimeEntry, Task, Project } from "../../database/models";

class TimeEntryService {
  private async verifyTaskAccess(taskId: string, userId: string): Promise<Task> {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error("Task not found or access denied.");
    }

    const project = await Project.findOne({
      where: { id: task.getDataValue("projectId"), userId },
    });
    if (!project) {
      throw new Error("Task not found or access denied.");
    }

    return task;
  }

  private async verifyEntryAccess(entryId: string, userId: string): Promise<TimeEntry> {
    const entry = await TimeEntry.findByPk(entryId);
    if (!entry) {
      throw new Error("Time entry not found or access denied.");
    }

    const task = await Task.findByPk(entry.getDataValue("taskId"));
    if (!task) {
      throw new Error("Associated task not found.");
    }

    const project = await Project.findOne({
      where: { id: task.getDataValue("projectId"), userId },
    });
    if (!project) {
      throw new Error("Time entry not found or access denied.");
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

    return timeEntry;
  }


  async getTimeEntriesForTask(userId: string, taskId: string) {
    const task = await this.verifyTaskAccess(taskId, userId);

    const timeEntries = await TimeEntry.findAll({
      where: { taskId },
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    // calculate the total time logged for the task
    // by iterating through the time entries and adding the duration of each entry
    const totalLoggedTime = timeEntries.reduce(
      (sum, entry) => sum + Number(entry.getDataValue("duration")),
      0
    );

    const estimatedTime = task.getDataValue("estimatedTime");
    let remainingTime = null;
    let overrunTime = null;

    if (estimatedTime !== undefined && estimatedTime !== null) {
      if (totalLoggedTime > estimatedTime) {
        overrunTime = totalLoggedTime - estimatedTime;
        remainingTime = 0;
      } else {
        remainingTime = estimatedTime - totalLoggedTime;
        overrunTime = 0;
      }
    }

    return {
      timeEntries, // returns the list of time entries for the task
      totalLoggedTime, // returns the total time logged for the task
      remainingTime, // returns the remaining time for the task
      overrunTime, // returns the overrun time for the task
    };
  }

  async updateTimeEntry(userId: string, entryId: string, data: any) {
    const entry = await this.verifyEntryAccess(entryId, userId);

    await entry.update({
      duration: data.duration !== undefined ? data.duration : entry.getDataValue("duration"),
      date: data.date !== undefined ? data.date : entry.getDataValue("date"),
      note: data.note !== undefined ? data.note : entry.getDataValue("note"),
    });

    return entry;
  }

  async deleteTimeEntry(userId: string, entryId: string) {
    const entry = await this.verifyEntryAccess(entryId, userId);
    await entry.destroy();
    return { message: "Time entry deleted successfully" };
  }
}

export default new TimeEntryService();
