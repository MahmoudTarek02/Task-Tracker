import { Router } from "express";
import taskController from "./task.controller";
import timeEntryController from "../time-entry/time-entry.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createTaskSchema, updateTaskSchema, getTasksQuerySchema } from "./task.validation";
import { createTimeEntrySchema } from "../time-entry/time-entry.validation";

const router = Router();

router.use(authenticateToken);

router.post("/", validate(createTaskSchema), taskController.create);
router.get("/", validate(getTasksQuerySchema, "query"), taskController.list);
router.put("/:id", validate(updateTaskSchema), taskController.update);
router.delete("/:id", taskController.delete);

// adds a new log to a task
router.post("/:taskId/time-entries", timeEntryController.create);
// gets all time entries for a task
router.get("/:taskId/time-entries", timeEntryController.list);


export default router;
