import { Router } from "express";
import timeEntryController from "./time-entry.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware globally to all time entry routes
router.use(authenticateToken);

router.put("/:id", timeEntryController.update);
router.delete("/:id", timeEntryController.delete);

export default router;
