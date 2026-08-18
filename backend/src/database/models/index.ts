import User from "./user.model";
import Project from "./project.model";
import Task from "./task.model";
import TimeEntry from "./time-entry.model";
import TaskAuditLog from "./task-audit-log.model";

// Setup associations
User.hasMany(Project, { foreignKey: "userId", as: "projects", onDelete: "CASCADE" });
Project.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(Task, { foreignKey: "projectId", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Task.hasMany(TimeEntry, { foreignKey: "taskId", as: "timeEntries", onDelete: "CASCADE" });
TimeEntry.belongsTo(Task, { foreignKey: "taskId", as: "task" });

Task.hasMany(TaskAuditLog, { foreignKey: "taskId", as: "auditLogs", onDelete: "CASCADE" });
TaskAuditLog.belongsTo(Task, { foreignKey: "taskId", as: "task" });

User.hasMany(TaskAuditLog, { foreignKey: "userId", as: "auditLogs", onDelete: "CASCADE" });
TaskAuditLog.belongsTo(User, { foreignKey: "userId", as: "actor" });

export { User, Project, Task, TimeEntry, TaskAuditLog };

