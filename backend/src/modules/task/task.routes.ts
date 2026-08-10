import { Router } from "express";
import taskController from "./task.controller";
import timeEntryController from "../time-entry/time-entry.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware globally to all task routes
router.use(authenticateToken);

router.post("/", taskController.create);
router.get("/", taskController.list);
router.put("/:id", taskController.update);
router.delete("/:id", taskController.delete);

// adds a new log to a task
router.post("/:taskId/time-entries", timeEntryController.create);
// gets all time entries for a task
router.get("/:taskId/time-entries", timeEntryController.list);


export default router;
