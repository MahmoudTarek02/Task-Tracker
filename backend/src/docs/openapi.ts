export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "TaskTrack API",
    version: "1.0.0",
    description: "API documentation for the TaskTrack personal project and task management application",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  security: [
    {
      cookieAuth: [],
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
          },
          400: {
            description: "Validation failed or duplicate email",
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in an existing user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in successfully",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "Cookie containing the JWT token",
              },
            },
          },
          401: {
            description: "Invalid email or password",
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Log out the current user",
        tags: ["Auth"],
        responses: {
          200: {
            description: "Signed out successfully",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current user profile info",
        tags: ["Auth"],
        responses: {
          200: {
            description: "User profile fetched successfully",
          },
          401: {
            description: "Not authenticated",
          },
        },
      },
    },
    "/auth/verify-email": {
      get: {
        summary: "Verify user email using token",
        tags: ["Auth"],
        security: [],
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Email verified successfully",
          },
          400: {
            description: "Invalid or expired token",
          },
        },
      },
    },
    "/projects": {
      get: {
        summary: "List all projects for the logged in user",
        tags: ["Projects"],
        responses: {
          200: {
            description: "List of projects",
          },
          401: {
            description: "Not authenticated",
          },
        },
      },
      post: {
        summary: "Create a new project",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created successfully",
          },
          400: {
            description: "Validation failed",
          },
          409: {
            description: "Project name already exists",
          },
        },
      },
    },
    "/projects/{id}": {
      put: {
        summary: "Update an existing project",
        tags: ["Projects"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Project updated successfully",
          },
          404: {
            description: "Project not found",
          },
        },
      },
      delete: {
        summary: "Delete a project",
        tags: ["Projects"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Project deleted successfully",
          },
          404: {
            description: "Project not found",
          },
        },
      },
    },
    "/tasks": {
      get: {
        summary: "List tasks for a project with optional filters",
        tags: ["Tasks"],
        parameters: [
          {
            name: "projectId",
            in: "query",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["To Do", "In Progress", "Done", ""] },
          },
          {
            name: "priority",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["Low", "Medium", "High", ""] },
          },
          {
            name: "overdue",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          200: {
            description: "List of tasks",
          },
          400: {
            description: "Invalid query options",
          },
        },
      },
      post: {
        summary: "Create a new task in a project",
        tags: ["Tasks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "projectId"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  projectId: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["To Do", "In Progress", "Done"] },
                  priority: { type: "string", enum: ["Low", "Medium", "High"] },
                  estimatedTime: { type: "integer", nullable: true },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Task created successfully",
          },
          400: {
            description: "Validation failed or access denied",
          },
        },
      },
    },
    "/tasks/{id}": {
      put: {
        summary: "Update an existing task",
        tags: ["Tasks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  status: { type: "string", enum: ["To Do", "In Progress", "Done"] },
                  priority: { type: "string", enum: ["Low", "Medium", "High"] },
                  estimatedTime: { type: "integer", nullable: true },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Task updated successfully",
          },
          404: {
            description: "Task not found",
          },
        },
      },
      delete: {
        summary: "Delete a task",
        tags: ["Tasks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Task deleted successfully",
          },
          404: {
            description: "Task not found",
          },
        },
      },
    },
    "/tasks/{taskId}/time-entries": {
      get: {
        summary: "List all time entries logged for a specific task",
        tags: ["Time Entries"],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "List of time entries and summaries",
          },
          404: {
            description: "Task not found",
          },
        },
      },
      post: {
        summary: "Log a time entry on a task",
        tags: ["Time Entries"],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["duration", "date"],
                properties: {
                  duration: { type: "integer" },
                  date: { type: "string", format: "date" },
                  note: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Time entry created successfully",
          },
          400: {
            description: "Validation failed",
          },
        },
      },
    },
    "/time-entries/{id}": {
      put: {
        summary: "Update an existing time entry",
        tags: ["Time Entries"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  duration: { type: "integer" },
                  date: { type: "string", format: "date" },
                  note: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Time entry updated successfully",
          },
          404: {
            description: "Time entry not found",
          },
        },
      },
      delete: {
        summary: "Delete a time entry",
        tags: ["Time Entries"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Time entry deleted successfully",
          },
          404: {
            description: "Time entry not found",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
      },
    },
  },
};
