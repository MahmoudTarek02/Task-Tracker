"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Project name is required")
        .max(100, "Project name cannot exceed 100 characters")
        .trim(),
    description: zod_1.z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .trim()
        .optional()
        .nullable(),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Project name cannot be empty")
        .max(100, "Project name cannot exceed 100 characters")
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .trim()
        .optional()
        .nullable(),
});
//# sourceMappingURL=project.validation.js.map