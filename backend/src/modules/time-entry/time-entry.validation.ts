import { z } from "zod";

export const createTimeEntrySchema = z.object({
  duration: z
    .number()
    .int("Duration must be an integer (minutes)")
    .positive("Duration must be a positive number"),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  note: z
    .string()
    .max(1000, "Note cannot exceed 1000 characters")
    .trim()
    .optional()
    .nullable(),
});

export const updateTimeEntrySchema = z.object({
  duration: z
    .number()
    .int("Duration must be an integer (minutes)")
    .positive("Duration must be a positive number")
    .optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional(),
  note: z
    .string()
    .max(1000, "Note cannot exceed 1000 characters")
    .trim()
    .optional()
    .nullable(),
});
