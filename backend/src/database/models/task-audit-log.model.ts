import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database";

class TaskAuditLog extends Model {}

TaskAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tasks",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "TaskAuditLog",
    tableName: "task_audit_logs",
    timestamps: true,
    updatedAt: false,
  }
);

export default TaskAuditLog;
