import { Router } from "express";
import projectController from "./project.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware globally to all project routes
router.use(authenticateToken);

router.post("/", projectController.create);
router.get("/", projectController.list);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.delete);

export default router;
