"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = exports.Project = exports.User = void 0;
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const project_model_1 = __importDefault(require("./project.model"));
exports.Project = project_model_1.default;
const task_model_1 = __importDefault(require("./task.model"));
exports.Task = task_model_1.default;
// Setup associations
user_model_1.default.hasMany(project_model_1.default, { foreignKey: "userId", as: "projects", onDelete: "CASCADE" });
project_model_1.default.belongsTo(user_model_1.default, { foreignKey: "userId", as: "user" });
project_model_1.default.hasMany(task_model_1.default, { foreignKey: "projectId", as: "tasks", onDelete: "CASCADE" });
task_model_1.default.belongsTo(project_model_1.default, { foreignKey: "projectId", as: "project" });
//# sourceMappingURL=index.js.map