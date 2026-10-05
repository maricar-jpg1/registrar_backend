# Registrar System Backend

This backend is designed for the React/Vite Registrar System frontend.

The supplied frontend uses:

    http://localhost:5000/api

So the backend runs on port 5000 by default.

## 1. Requirements

Install:

- Node.js
- PostgreSQL
- VS Code or another code editor

## 2. Create PostgreSQL database

Open pgAdmin Query Tool or psql.

Run:

```sql
CREATE DATABASE registrar_system;
```

Then connect to `registrar_system`.

You can either run `database.sql` manually or use the seed command below.

## 3. Configure .env

Copy:

    .env.example

to:

    .env

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=registrar_system
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
JWT_SECRET=change_this_to_a_long_random_secret
FRONTEND_URL=http://localhost:5173
```

Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.

Do not upload `.env` to GitHub.

## 4. Install backend packages

Open PowerShell in the backend folder:

```powershell
cd backend
npm install
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd install
```

and:

```powershell
npm.cmd run seed
npm.cmd start
```

## 5. Create tables + sample data

Run:

```powershell
npm run seed
```

This creates the tables and inserts sample records.

Default login:

    Username: admin
    Password: admin123

## 6. Start backend

```powershell
npm start
```

You should see:

    PostgreSQL connected.
    Registrar API running at http://localhost:5000

## 7. Check the API

Open this in the browser:

    http://localhost:5000/

Expected:

```json
{
  "success": true,
  "message": "Registrar Management System API is running"
}
```

Then open:

    http://localhost:5000/api/health

Expected result:

```json
{
  "success": true,
  "message": "API and PostgreSQL connection are working",
  "server_time": "...",
  "database_time": "..."
}
```

If `/api/health` works, your Node/Express API and PostgreSQL database are connected.

## 8. Test login API

Use PowerShell:

```powershell
$body = @{
  username = "admin"
  password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

The response should contain:

    success: true
    data.token

Copy the token for protected endpoint testing.

## 9. Test a protected API

PowerShell:

```powershell
$login = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    username = "admin"
    password = "admin123"
  } | ConvertTo-Json)

$token = $login.data.token

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/students" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }
```

You should receive student records.

## 10. Check frontend -> backend

The supplied frontend API service uses:

```js
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
```

Therefore run both applications.

Terminal 1:

```powershell
cd backend
npm start
```

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Open:

    http://localhost:5173

Login with:

    admin
    admin123

If login succeeds, the frontend is communicating with the backend.

## 11. Check connection in Chrome

Open the frontend:

    http://localhost:5173

Press:

    F12

Go to:

    Network

Login.

Look for:

    POST /api/auth/login

A successful request should have:

    Status 200

Then open the Dashboard and look for requests such as:

    GET /api/dashboard/stats
    GET /api/dashboard/recent-students
    GET /api/dashboard/recent-enrollments
    GET /api/dashboard/today-schedule

If these return 200, the frontend is successfully calling the backend.

## 12. Check PostgreSQL directly

In pgAdmin Query Tool, connect to:

    registrar_system

Run:

```sql
SELECT * FROM users;
SELECT * FROM students;
SELECT * FROM faculty;
SELECT * FROM subjects;
SELECT * FROM enrollments;
SELECT * FROM enrollment_subjects;
SELECT * FROM grades;
SELECT * FROM schedules;
SELECT * FROM settings;
SELECT * FROM notifications;
```

You should see the seed records.

## 13. Main API endpoints

Authentication:

    POST   /api/auth/login
    GET    /api/auth/me

Dashboard:

    GET    /api/dashboard/stats
    GET    /api/dashboard/recent-students
    GET    /api/dashboard/recent-enrollments
    GET    /api/dashboard/today-schedule

Students:

    GET    /api/students
    GET    /api/students/:id
    POST   /api/students
    PUT    /api/students/:id
    DELETE /api/students/:id

Faculty:

    GET    /api/faculty
    GET    /api/faculty/:id
    POST   /api/faculty
    PUT    /api/faculty/:id
    DELETE /api/faculty/:id

Subjects:

    GET    /api/subjects
    POST   /api/subjects
    PUT    /api/subjects/:id
    DELETE /api/subjects/:id

Enrollments:

    GET    /api/enrollments
    GET    /api/enrollments/:id
    POST   /api/enrollments
    PATCH  /api/enrollments/:id/status
    DELETE /api/enrollments/:id

Grades:

    GET    /api/grades
    POST   /api/grades
    PUT    /api/grades/:id
    DELETE /api/grades/:id

Schedules:

    GET    /api/schedules
    POST   /api/schedules
    DELETE /api/schedules/:id

Reports:

    GET    /api/reports/generate?type=students
    GET    /api/reports/generate?type=faculty
    GET    /api/reports/generate?type=enrollments
    GET    /api/reports/generate?type=subjects
    GET    /api/reports/generate?type=grades
    GET    /api/reports/generate?type=schedules

Settings:

    GET    /api/settings
    PUT    /api/settings
    PUT    /api/settings/password

Notifications:

    GET    /api/notifications
    PATCH  /api/notifications/:id/read

## 14. Important frontend/backend connection

The frontend stores the JWT in localStorage:

    token

The Axios interceptor sends:

    Authorization: Bearer <token>

Protected backend routes use the JWT middleware.

If the frontend gives:

    401 Unauthorized

check:

1. Backend is running.
2. PostgreSQL is running.
3. Login succeeded.
4. `token` exists in browser Local Storage.
5. Frontend is using `http://localhost:5000/api`.
6. `.env` has the same `JWT_SECRET` while the server is running.
7. CORS allows `http://localhost:5173`.

## 15. Common PostgreSQL errors

### password authentication failed

Your DB_PASSWORD is wrong.

Update `.env`:

```env
DB_PASSWORD=your_real_postgres_password
```

Restart the backend.

### database "registrar_system" does not exist

Create it:

```sql
CREATE DATABASE registrar_system;
```

Then run:

```powershell
npm run seed
```

### relation "students" does not exist

Run:

```powershell
npm run seed
```

### EADDRINUSE: port 5000 already in use

Find the process:

```powershell
netstat -ano | findstr :5000
```

Then stop the process if appropriate, or change:

```env
PORT=5001
```

If you change the backend port, also change the frontend Axios `baseURL`.

## 16. Project structure

```text
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── studentsController.js
│   ├── facultyController.js
│   ├── subjectsController.js
│   ├── enrollmentsController.js
│   ├── gradesController.js
│   ├── schedulesController.js
│   ├── reportsController.js
│   ├── settingsController.js
│   └── notificationsController.js
├── middleware/
│   ├── auth.js
│   └── validate.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── students.js
│   ├── faculty.js
│   ├── subjects.js
│   ├── enrollments.js
│   ├── grades.js
│   ├── schedules.js
│   ├── reports.js
│   ├── settings.js
│   └── notifications.js
├── seed/
│   └── seed.js
├── .env.example
├── database.sql
├── package.json
├── README.md
└── server.js
```
