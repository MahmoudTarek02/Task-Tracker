"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, "Task title is required")
        .max(150, "Task title cannot exceed 150 characters")
        .trim(),
    description: zod_1.z
        .string()
        .max(2000, "Description cannot exceed 2000 characters")
        .trim()
        .optional()
        .nullable(),
    status: zod_1.z.enum(["To Do", "In Progress", "Done"]).optional(),
    priority: zod_1.z.enum(["Low", "Medium", "High"]).optional(),
    estimatedTime: zod_1.z
        .number()
        .int("Estimated time must be an integer (minutes)")
        .nonnegative("Estimated time cannot be negative")
        .optional()
        .nullable(),
    dueDate: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    projectId: zod_1.z
        .string()
        .uuid("Project ID must be a valid UUID"),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, "Task title cannot be empty")
        .max(150, "Task title cannot exceed 150 characters")
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .max(2000, "Description cannot exceed 2000 characters")
        .trim()
        .optional()
        .nullable(),
    status: zod_1.z.enum(["To Do", "In Progress", "Done"]).optional(),
    priority: zod_1.z.enum(["Low", "Medium", "High"]).optional(),
    estimatedTime: zod_1.z
        .number()
        .int("Estimated time must be an integer (minutes)")
        .nonnegative("Estimated time cannot be negative")
        .optional()
        .nullable(),
    dueDate: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
});
//# sourceMappingURL=task.validation.js.map