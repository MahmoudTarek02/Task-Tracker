import { describe, it, expect, vi, beforeEach } from "vitest";
import projectService from "../modules/project/project.service";
import { Project } from "../database/models";
import { ConflictError, NotFoundError } from "../utils/errors";
import { UniqueConstraintError } from "sequelize";

describe("ProjectService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createProject", () => {
    it("should create project successfully", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue(null);
      const mockProject = { id: "p123", name: "New Project" };
      vi.spyOn(Project, "create").mockResolvedValue(mockProject as any);

      const result = await projectService.createProject("u123", "New Project", "Desc");

      expect(Project.findOne).toHaveBeenCalled();
      expect(Project.create).toHaveBeenCalledWith({
        name: "New Project",
        description: "Desc",
        userId: "u123",
      });
      expect(result).toEqual(mockProject);
    });

    // application-level duplicate check
    it("should throw ConflictError if name already exists (application level check)", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue({ id: "existing" } as any);

      await expect(
        projectService.createProject("u123", "Dup Project", "Desc")
      ).rejects.toThrow(new ConflictError("A project with this name already exists."));
    });
    // database-level unique constraint check
    // race condition
    it("should handle unique constraint error from database", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue(null);
      
      const dbError = new UniqueConstraintError({
        message: "Unique constraint error",
        errors: [],
      });
      
      vi.spyOn(Project, "create").mockRejectedValue(dbError);

      await expect(
        projectService.createProject("u123", "Dup Project", "Desc")
      ).rejects.toThrow();
    });
  });

  describe("getProjectsByUser", () => {
    it("should return list of projects for a user", async () => {
      const mockProjects = [{ id: "p1", name: "P1" }, { id: "p2", name: "P2" }];
      vi.spyOn(Project, "findAll").mockResolvedValue(mockProjects as any);

      const result = await projectService.getProjectsByUser("u123");

      expect(Project.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });
  });

  describe("updateProject", () => {
    it("should update successfully", async () => {
      const mockProject = {
        getDataValue: vi.fn((key) => {
          if (key === "name") return "Old Name";
          return null;
        }),
        update: vi.fn().mockResolvedValue(undefined),
      };
      
      vi.spyOn(Project, "findOne")
        .mockResolvedValueOnce(mockProject as any) // first call from getProjectByIdAndUser
        .mockResolvedValueOnce(null); // second call from duplicate check

      const result = await projectService.updateProject("p123", "u123", { name: "New Name" });

      expect(mockProject.update).toHaveBeenCalledWith({ name: "New Name" });
      expect(result).toBe(mockProject);
    });

    // getProjectByIdAndUser fails
    it("should throw NotFoundError if project is not found", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue(null);

      await expect(
        projectService.updateProject("p123", "u123", { name: "Name" })
      ).rejects.toThrow(new NotFoundError("Project not found or access denied."));
    });

    // getProjectByIdAndUser successful but duplicate name detected
    it("should throw ConflictError if updating to an existing project name", async () => {
      const mockProject = {
        getDataValue: vi.fn((key) => {
          if (key === "name") return "Old Name";
          return null;
        }),
      };
      
      vi.spyOn(Project, "findOne")
        .mockResolvedValueOnce(mockProject as any) // first call from getProjectByIdAndUser
        .mockResolvedValueOnce({ id: "dup" } as any); // second call from duplicate check

      await expect(
        projectService.updateProject("p123", "u123", { name: "Dup Name" })
      ).rejects.toThrow(new ConflictError("A project with this name already exists."));
    });
  });

  describe("deleteProject", () => {
    it("should delete project successfully", async () => {
      const mockProject = {
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(Project, "findOne").mockResolvedValue(mockProject as any);

      const result = await projectService.deleteProject("p123", "u123");

      expect(mockProject.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: "Project deleted successfully" });
    });

    it("should throw NotFoundError if project is not found", async () => {
      vi.spyOn(Project, "findOne").mockResolvedValue(null);

      await expect(
        projectService.deleteProject("p123", "u123")
      ).rejects.toThrow(new NotFoundError("Project not found or access denied."));
    });
  });
});
