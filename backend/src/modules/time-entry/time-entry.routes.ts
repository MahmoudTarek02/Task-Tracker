import { Router } from "express";
import timeEntryController from "./time-entry.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateTimeEntrySchema } from "./time-entry.validation";

const router = Router();

router.use(authenticateToken);

router.put("/:id", validate(updateTimeEntrySchema), timeEntryController.update);
router.delete("/:id", timeEntryController.delete);

export default router;
