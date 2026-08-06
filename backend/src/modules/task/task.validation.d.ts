import { z } from "zod";
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        Done: "Done";
        "In Progress": "In Progress";
        "To Do": "To Do";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        High: "High";
        Low: "Low";
        Medium: "Medium";
    }>>;
    estimatedTime: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodString;
}, z.core.$strip>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        Done: "Done";
        "In Progress": "In Progress";
        "To Do": "To Do";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        High: "High";
        Low: "Low";
        Medium: "Medium";
    }>>;
    estimatedTime: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=task.validation.d.ts.map