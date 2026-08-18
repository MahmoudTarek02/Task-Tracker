import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { sequelize } from "./config/database";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

let server: any;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info("Connected to PostgreSQL");

    server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
}

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown.`);
  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");
      try {
        await sequelize.close();
        logger.info("Database connection closed.");
        process.exit(0);
      } catch (err) {
        logger.error("Error closing database connection:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

start();