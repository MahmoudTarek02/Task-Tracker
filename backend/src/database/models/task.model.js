"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class Task extends sequelize_1.Model {
}
Task.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("To Do", "In Progress", "Done"),
        defaultValue: "To Do",
        allowNull: false,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM("Low", "Medium", "High"),
        defaultValue: "Medium",
        allowNull: false,
    },
    estimatedTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    projectId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "Task",
    tableName: "tasks",
    timestamps: true,
});
exports.default = Task;
//# sourceMappingURL=task.model.js.map