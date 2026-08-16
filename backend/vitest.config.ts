import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      DATABASE_URL: "postgres://dummy:dummy@localhost:5432/dummy_db",
      JWT_SECRET: "test_secret_key_12345",
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        lines: 80,
      },
      exclude: [
        "dist/**",
        "node_modules/**",
        "src/database/migrations/**",
        "src/config/**",
        "src/database/models/index.ts", // association entry point
        "eslint.config.js",
        "vitest.config.ts",
        "src/server.ts", // starting server entry point
        "src/docs/**", // API swagger documentation definition
      ],
    },
  },
});
