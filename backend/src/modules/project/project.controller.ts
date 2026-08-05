import { Request, Response } from "express";
import projectService from "./project.service";
import { createProjectSchema, updateProjectSchema } from "./project.validation";

class ProjectController {

  async create(req: Request, res: Response) {
    const authReq = req as any;
    
    // user should be authenticated to create a project
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = createProjectSchema.safeParse(req.body);
    if (!result.success) { // validation fail, which is implemented by Zod
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    const { name, description } = result.data;
    try {
      const project = await projectService.createProject(authReq.user.id, name, description);
      return res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to create project",
      });
    }
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const projects = await projectService.getProjectsByUser(authReq.user.id);
      return res.status(200).json({
        projects,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Failed to fetch projects",
      });
    }
  }

  async update(req: Request, res: Response) {
    const authReq = req as any;

    // user should be authenticated to update a project
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    const result = updateProjectSchema.safeParse(req.body);
    if (!result.success) { // validation fail
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    try {
      const project = await projectService.updateProject(id, authReq.user.id, result.data);
      return res.status(200).json({
        message: "Project updated successfully",
        project,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to update project",
      });
    }
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;

    // user should be authenticated to delete a project
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;
    try {
      const result = await projectService.deleteProject(id, authReq.user.id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to delete project",
      });
    }
  }
}

export default new ProjectController();
