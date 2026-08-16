import User from "./user.model";
import Project from "./project.model";
import Task from "./task.model";

// Setup associations
User.hasMany(Project, { foreignKey: "userId", as: "projects", onDelete: "CASCADE" });
Project.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(Task, { foreignKey: "projectId", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

export { User, Project, Task };
