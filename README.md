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

### Docker Setup
Copy the example environment file at the root of the project to a new `.env` file:
```bash
cp .env.example .env
```
Populate `.env` with your desired configuration (e.g., credentials, secrets, email settings).

> [!IMPORTANT]
> **Email Credentials for Registration**: To test the User Registration flow, you **must** update the `EMAIL_USER` and `EMAIL_PASS` settings in your `.env` file with valid SMTP/Gmail credentials. If you leave the placeholder values, user registration will fail with a `500` error because the server cannot send the verification email.

### Native Local Setup
Alternatively, if running without Docker, create a `.env` file inside the `backend` folder containing:
```ini
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/tasktrack_db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
LOG_LEVEL=info
```

---

## Database Migrations (Native Setup)

Before starting the application natively, set up your PostgreSQL database schema by running the migrations from the `backend` folder:

```bash
# Inside the /backend directory
npx sequelize-cli db:migrate
```

---

## Docker Usage

To run the entire stack (React frontend, Express backend, PostgreSQL database) in Docker containers:

### 1. Build and Start Services
```bash
docker compose up -d --build
```
This builds the backend and frontend images, starts the database, and boots all services. 
*Note: The frontend dev server binds to `0.0.0.0` to be accessible from the host.*

### 2. Database Migrations
Migrations are applied **automatically** during container startup. If you ever need to apply migrations manually or run new ones:
```bash
docker compose exec backend npx sequelize-cli db:migrate
```

### 3. Accessing the Application
- **Frontend client**: [http://localhost:5178](http://localhost:5178)
- **Backend API**: [http://localhost:3008](http://localhost:3008)
- **API Documentation (Swagger)**: [http://localhost:3008/api-docs](http://localhost:3008/api-docs)
- **Database Shell (psql)**: Access the PostgreSQL shell directly inside the container:
  ```bash
  docker exec -it task-tracker-db psql -U postgres -d task_tracker
  ```

### 4. Viewing Logs
To stream backend operational logs in real-time:
```bash
docker compose logs -f backend
```

### 5. Stopping the Application
To stop all running services:
```bash
docker compose down
```
*Note: To destroy the persistent PostgreSQL volume and reset the database state completely, run `docker compose down -v`.*

---

## Native Local Usage (Alternative)

To run the application locally on your machine without Docker:

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
