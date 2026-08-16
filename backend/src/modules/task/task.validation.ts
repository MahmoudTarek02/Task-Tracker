import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional()
    .nullable(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  estimatedTime: z
    .number()
    .int("Estimated time must be an integer (minutes)")
    .nonnegative("Estimated time cannot be negative")
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional()
    .nullable(),
  projectId: z
    .string()
    .uuid("Project ID must be a valid UUID"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title cannot be empty")
    .max(150, "Task title cannot exceed 150 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional()
    .nullable(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  estimatedTime: z
    .number()
    .int("Estimated time must be an integer (minutes)")
    .nonnegative("Estimated time cannot be negative")
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional()
    .nullable(),
});
