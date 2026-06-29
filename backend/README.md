# Taskcraft Backend (local demo)

Quick demo backend that serves a file-backed JSON datastore with simple REST endpoints for `users`, `projects`, and `tasks`.

Run:

```bash
cd backend
npm install
npm start
```

API base: `http://localhost:4000/api`

Endpoints:
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/users`
- `POST /api/register`
- `POST /api/login`

This is intentionally minimal for local development; adapt authentication and persistence for production.
