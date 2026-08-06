"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = __importDefault(require("./project.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware globally to all project routes
router.use(auth_middleware_1.authenticateToken);
router.post("/", project_controller_1.default.create);
router.get("/", project_controller_1.default.list);
router.put("/:id", project_controller_1.default.update);
router.delete("/:id", project_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=project.routes.js.map