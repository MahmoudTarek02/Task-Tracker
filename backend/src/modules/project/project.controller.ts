import { Request, Response } from "express";
import projectService from "./project.service";

class ProjectController {
  async create(req: Request, res: Response) {
    const authReq = req as any;
    const { name, description } = req.body;
    const project = await projectService.createProject(authReq.user.id, name, description);
    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  }

  async list(req: Request, res: Response) {
    const authReq = req as any;
    const projects = await projectService.getProjectsByUser(authReq.user.id);
    return res.status(200).json({
      projects,
    });
  }

  async update(req: Request, res: Response) {
    const authReq = req as any;
    const id = req.params.id as string;
    const project = await projectService.updateProject(id, authReq.user.id, req.body);
    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  }

  async delete(req: Request, res: Response) {
    const authReq = req as any;
    const id = req.params.id as string;
    const result = await projectService.deleteProject(id, authReq.user.id);
    return res.status(200).json(result);
  }
}

export default new ProjectController();
