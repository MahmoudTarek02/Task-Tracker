import { Router } from "express";
import projectController from "./project.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createProjectSchema, updateProjectSchema } from "./project.validation";

const router = Router();

router.use(authenticateToken);

router.post("/", validate(createProjectSchema), projectController.create);
router.get("/", projectController.list);
router.put("/:id", validate(updateProjectSchema), projectController.update);
router.delete("/:id", projectController.delete);

export default router;
