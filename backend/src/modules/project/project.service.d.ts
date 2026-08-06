import { Project } from "../../database/models";
declare class ProjectService {
    createProject(userId: string, name: string, description?: string | null): Promise<Project>;
    getProjectsByUser(userId: string): Promise<Project[]>;
    getProjectByIdAndUser(projectId: string, userId: string): Promise<Project | null>;
    updateProject(projectId: string, userId: string, updateData: {
        name?: string | undefined;
        description?: string | null | undefined;
    }): Promise<Project>;
    deleteProject(projectId: string, userId: string): Promise<{
        message: string;
    }>;
}
declare const _default: ProjectService;
export default _default;
//# sourceMappingURL=project.service.d.ts.map