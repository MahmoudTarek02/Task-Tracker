import { Router } from "express";
import taskController from "./task.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware globally to all task routes
router.use(authenticateToken);

router.post("/", taskController.create);
router.get("/", taskController.list);
router.put("/:id", taskController.update);
router.delete("/:id", taskController.delete);

export default router;
