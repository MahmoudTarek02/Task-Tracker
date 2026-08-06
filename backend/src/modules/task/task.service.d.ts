import { Task } from "../../database/models";
declare class TaskService {
    createTask(userId: string, taskData: any): Promise<Task>;
    getTasksByProject(userId: string, projectId: string): Promise<Task[]>;
    getTaskByIdAndUser(taskId: string, userId: string): Promise<Task | null>;
    updateTask(userId: string, taskId: string, updateData: any): Promise<Task>;
    deleteTask(userId: string, taskId: string): Promise<{
        message: string;
    }>;
}
declare const _default: TaskService;
export default _default;
//# sourceMappingURL=task.service.d.ts.map