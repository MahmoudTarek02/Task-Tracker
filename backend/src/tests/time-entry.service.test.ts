import { describe, it, expect, vi, beforeEach } from "vitest";
import timeEntryService from "../modules/time-entry/time-entry.service";
import { TimeEntry, Task, Project, TaskAuditLog } from "../database/models";
import { NotFoundError } from "../utils/errors";

describe("TimeEntryService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  
  // Task.findByPk finds the task, Project.findOne finds the project (access granted),
  // so the entry gets created and an audit log entry is written for it
  describe("createTimeEntry", () => {
    it("should successfully log time and write audit entry", async () => {
      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
      };
      
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      
      const mockTimeEntry = {
        getDataValue: vi.fn((key) => {
          if (key === "duration") return 60;
          if (key === "date") return "2026-08-16";
          if (key === "note") return "logged work";
          return null;
        }),
      };
      vi.spyOn(TimeEntry, "create").mockResolvedValue(mockTimeEntry as any);
      vi.spyOn(TaskAuditLog, "create").mockResolvedValue({} as any);

      const result = await timeEntryService.createTimeEntry("u123", "t123", {
        duration: 60,
        date: "2026-08-16",
        note: "logged work",
      });

      expect(Task.findByPk).toHaveBeenCalledWith("t123");
      expect(Project.findOne).toHaveBeenCalledWith({ where: { id: "p123", userId: "u123" } });
      expect(TimeEntry.create).toHaveBeenCalledWith({
        taskId: "t123",
        duration: 60,
        date: "2026-08-16",
        note: "logged work",
      });
      expect(TaskAuditLog.create).toHaveBeenCalled();
      expect(result).toBe(mockTimeEntry);
    });
    // Task.findByPk returns null (not found or access denied) => throws NotFoundError
    it("should throw NotFoundError if task does not exist", async () => {
      vi.spyOn(Task, "findByPk").mockResolvedValue(null);

      await expect(
        timeEntryService.createTimeEntry("u123", "t123", { duration: 60 })
      ).rejects.toThrow(new NotFoundError("Task not found or access denied."));
    });

    // Task.findByPk finds the task, but Project.findOne returns null (access denied) => throws NotFoundError
    it("should throw NotFoundError if user does not have access to the project", async () => {
      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue(null);

      await expect(
        timeEntryService.createTimeEntry("u123", "t123", { duration: 60 })
      ).rejects.toThrow(new NotFoundError("Task not found or access denied."));
    });
  });

  describe("getTimeEntriesForTask", () => {
    // dynamic: means remaining time and overrun time are calculated based on the estimated time
    // and they are calculated on the fly when the user requests for the time entries
    // so we don't need to store them in the database
    // and no need to let the frontend to do this calculation
    it("should return time entries with dynamic estimates remaining/overrun calculations", async () => {
      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          if (key === "estimatedTime") return 120;
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      const mockEntries = [
        { getDataValue: () => 60 },
        { getDataValue: () => 30 },
      ];
      vi.spyOn(TimeEntry, "findAll").mockResolvedValue(mockEntries as any);

      const result = await timeEntryService.getTimeEntriesForTask("u123", "t123");

      expect(result.totalLoggedTime).toBe(90);
      expect(result.remainingTime).toBe(30);
      expect(result.overrunTime).toBe(0);
    });

    // if task has no estimated time (null/undefined), remaining and overrun calculations are null
    //Flow:
    // Task.findByPk finds the task and returns it 
    // Project.findOne finds the project and returns it
    // TimeEntry.findAll fetches all time entries for the task and returns them
    // total logged time is calculated by summing up all the time entries
    // since estimated time is null, remaining time and overrun time are also null
    it("should return null estimates if task has no estimated time", async () => {
      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          if (key === "estimatedTime") return null;
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      // 60 is total logged time for this task
      const mockEntries = [
        { getDataValue: () => 60 },
      ];
      vi.spyOn(TimeEntry, "findAll").mockResolvedValue(mockEntries as any);

      const result = await timeEntryService.getTimeEntriesForTask("u123", "t123");
      
      // check if total logged time is 60
      expect(result.totalLoggedTime).toBe(60);
      // check if remaining time is null, as estimated time is null
      expect(result.remainingTime).toBeNull();
      // check if overrunTime is null as estimated time is null
      expect(result.overrunTime).toBeNull();
    });

    // if total logged time exceeds estimated time, remainingTime is 0 and overrunTime is the difference
    it("should calculate overrun time correctly when total logged time exceeds estimate", async () => {
      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          if (key === "estimatedTime") return 60;
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);

      // 2 time entries
      // 60 + 30 = 90 is total logged time
      // estimated time is 60
      // so overrun time is 90 - 60 = 30
      // remaining time is 0 as total logged time is greater than estimated time
      const mockEntries = [
        { getDataValue: () => 60 },
        { getDataValue: () => 30 },
      ];
      vi.spyOn(TimeEntry, "findAll").mockResolvedValue(mockEntries as any);

      const result = await timeEntryService.getTimeEntriesForTask("u123", "t123");

      expect(result.totalLoggedTime).toBe(90);
      expect(result.remainingTime).toBe(0);
      expect(result.overrunTime).toBe(30);
    });
  });

  describe("updateTimeEntry", () => {
    // TimeEntry.findByPk finds the time entry and returns it 
    // Task.findByPk finds the task and returns it
    // Project.findOne finds the project and returns it
    // TaskAuditLog.create creates an audit log entry
    // everything works as expected
    it("should successfully update and audit time entry", async () => {
      const mockEntry = {
        getDataValue: vi.fn((key) => {
          if (key === "taskId") return "t123";
          if (key === "duration") return 60;
          return null;
        }),
        update: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(TimeEntry, "findByPk").mockResolvedValue(mockEntry as any);

      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(TaskAuditLog, "create").mockResolvedValue({} as any);

      const result = await timeEntryService.updateTimeEntry("u123", "e123", { duration: 90 });

      expect(mockEntry.update).toHaveBeenCalled();
      expect(result).toBe(mockEntry);
    });

    // test case: no time entry exists, so can't update
    // TimeEntry.findByPk returns null
    // throws NotFoundError
    it("should throw NotFoundError if time entry does not exist", async () => {
      vi.spyOn(TimeEntry, "findByPk").mockResolvedValue(null);

      await expect(
        timeEntryService.updateTimeEntry("u123", "e123", { duration: 90 })
      ).rejects.toThrow(new NotFoundError("Time entry not found or access denied."));
    });
  });

  describe("deleteTimeEntry", () => {
    // TimeEntry.findByPk finds the time entry and returns it 
    // Task.findByPk finds the task and returns it
    // Project.findOne finds the project and returns it
    // TaskAuditLog.create creates an audit log entry
    // everything works as expected
    it("should successfully delete and audit time entry", async () => {
      const mockEntry = {
        getDataValue: vi.fn((key) => {
          if (key === "taskId") return "t123";
          if (key === "duration") return 60;
          return null;
        }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(TimeEntry, "findByPk").mockResolvedValue(mockEntry as any);

      const mockTask = {
        id: "t123",
        getDataValue: vi.fn((key) => {
          if (key === "projectId") return "p123";
          return null;
        }),
      };
      vi.spyOn(Task, "findByPk").mockResolvedValue(mockTask as any);
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "p123" } as any);
      vi.spyOn(TaskAuditLog, "create").mockResolvedValue({} as any);

      const result = await timeEntryService.deleteTimeEntry("u123", "e123");

      expect(mockEntry.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: "Time entry deleted successfully" });
    });
  });
});
