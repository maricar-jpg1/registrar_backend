\# Registrar Backend API



\## Overview



The Registrar System backend provides REST API endpoints for authentication,

students, faculty, subjects, enrollments, grades, schedules, reports,

notifications, dashboard data, and settings.



\## Server



Local development server:



http://localhost:5000



\## Health Check



GET /api/health



Used to verify that the backend server and PostgreSQL database are working.



\## Authentication



POST /api/auth/login



Used to authenticate a registrar user and receive a JWT token.



GET /api/auth/me



Returns information about the currently authenticated user.



\## Main API Modules



\### Students



GET /api/students



POST /api/students



PUT /api/students/:id



DELETE /api/students/:id



\### Faculty



GET /api/faculty



POST /api/faculty



PUT /api/faculty/:id



DELETE /api/faculty/:id



\### Subjects



GET /api/subjects



POST /api/subjects



PUT /api/subjects/:id



DELETE /api/subjects/:id



\### Enrollments



GET /api/enrollments



POST /api/enrollments



PUT /api/enrollments/:id



DELETE /api/enrollments/:id



\### Grades



GET /api/grades



POST /api/grades



PUT /api/grades/:id



DELETE /api/grades/:id



\### Schedules



GET /api/schedules



POST /api/schedules



PUT /api/schedules/:id



DELETE /api/schedules/:id



\### Reports



GET /api/reports/generate



Reports can be generated for students, faculty, enrollments, subjects,

grades, and schedules.



\## Database



The backend uses PostgreSQL.



Database:



registrar\_system



\## Security



Environment variables are stored in `.env` and are excluded from Git.



A `.env.example` file should be used to document required environment

variables without exposing passwords or secrets.

