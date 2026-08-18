# TaskTrack

TaskTrack is a personal project and task-management application that helps users organize their projects, break them down into tasks, track time logs, and monitor overdue items.

---

## Business Rules

*   **Data Isolation**: Strict multi-tenant boundaries. A logged-in user can only view, create, edit, or delete their own projects, tasks, and time entries.
*   **Project Uniqueness**: A user cannot have two projects with the exact same name. This uniqueness is enforced at both the database and application levels.
*   **Task Uniqueness**: Inside a single project, no two tasks can share the same title.
*   **Dynamic Overdue Auditing**: Tasks are evaluated as overdue dynamically if their due date is in the past and their status is not "Done".

---

## Architecture

The project is split into a backend API and a frontend client:

### Backend (`/backend`)
*   **Engine**: Node.js, Express 5, and TypeScript.
*   **Database**: PostgreSQL managed via Sequelize ORM.
*   **Validation**: Automated request validation using Zod middleware before routes hit controllers.
*   **Error Handling**: Centralized error middleware standardizing response shapes and preventing database detail leaks.
*   **Logging**: Structured console logging via Winston with automatic password and token redactions.
*   **API Docs**: Interactive Swagger documentation served at `/api-docs`.

### Frontend (`/frontend`)
*   **Engine**: React, Vite, and TypeScript.
*   **Routing**: React Router v7.
*   **API Client**: Axios configured with cookie credentials. Handles backend errors and displays visual alerts and retry triggers on request failure.

---

## Setup & Environment Variables

Create a `.env` file inside the `backend` folder containing:

```ini
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/tasktrack_db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
LOG_LEVEL=info
```

---

## Database Migrations

Before starting the application, set up your PostgreSQL database schema by running the migrations from the `backend` folder:

```bash
# Inside the /backend directory
npx sequelize-cli db:migrate
```

---

## Local Usage

To run the application locally on your machine, follow these steps:

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
The server will run on `http://localhost:3000`. You can inspect the API endpoints interactively at `http://localhost:3000/api-docs`.

### 2. Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.
