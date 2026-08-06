"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = __importDefault(require("./task.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware globally to all task routes
router.use(auth_middleware_1.authenticateToken);
router.post("/", task_controller_1.default.create);
router.get("/", task_controller_1.default.list);
router.put("/:id", task_controller_1.default.update);
router.delete("/:id", task_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=task.routes.js.map