# Smart Task & Team Management Portal

A dashboard web app for managing projects, tasks, and team members — built with React on the frontend and designed to plug into a Java Spring Boot or Node/Express backend with MySQL.

---

## What's included

The frontend is fully working with mock data stored in `localStorage`, so every screen — login, dashboard, projects, tasks, profile — works end-to-end in the browser without needing a server.

The backend isn't bundled here, but the REST API design and MySQL schema are documented below if you want to wire it up. The frontend is structured so that swapping the mock `src/lib/store.ts` for real `fetch` calls is basically a one-file change.

---

## Tech stack

| Layer | What's here |
|---|---|
| Frontend | React 19 + TanStack Start (Vite 7) + Tailwind v4 + shadcn/ui + Recharts |
| Forms | react-hook-form + Zod |
| Auth | JWT-shaped tokens stored in localStorage (mock — swap with real backend) |
| Notifications | sonner |
| Backend | Not included — see reference design below |
| Database | Not included — MySQL schema documented below |

---

## Getting started

```bash
bun install
bun run dev
```

Open the URL it prints. The app seeds demo data on first load so the dashboard isn't empty.

**Demo login:**
- Email: `demo@portal.app`
- Password: `demo1234`

Two more sample users (`alice@portal.app`, `bob@portal.app`, same password) and three projects with eight tasks are seeded automatically.

---

## Features

**Auth** — Register, login, logout. JWT session. Protected routes. Toast + form validation.

**Dashboard** — Project/task counts, tasks-by-project bar chart, status pie chart, upcoming tasks, active project progress.

**Projects** — Full CRUD. Search by title, description, or status. Deleting a project also removes its tasks.

**Tasks** — Full CRUD. Assign to users. Inline status updates (Pending / In Progress / Completed). Priority levels. Due dates. Filters by status, project, and keyword.

**Profile** — View and edit name, email, role.

**UX** — Mobile responsive, dark mode, collapsible sidebar, loading states, confirm dialogs, empty states, 404 page.

---

## Project structure

```
src/
├── routes/                    # File-based routing (TanStack Router)
│   ├── __root.tsx             # App shell + providers
│   ├── index.tsx              # / → redirects to /dashboard
│   ├── login.tsx
│   ├── register.tsx
│   ├── _authenticated.tsx     # Protected layout (sidebar + topbar)
│   ├── _authenticated.dashboard.tsx
│   ├── _authenticated.projects.tsx
│   ├── _authenticated.projects.new.tsx
│   ├── _authenticated.projects.$projectId.edit.tsx
│   ├── _authenticated.tasks.tsx
│   ├── _authenticated.tasks.new.tsx
│   ├── _authenticated.tasks.$taskId.edit.tsx
│   └── _authenticated.profile.tsx
├── components/
│   ├── ui/                    # shadcn primitives
│   ├── layout/                # sidebar, topbar, stat cards, badges, empty states
│   └── forms/                 # project and task forms
├── lib/
│   ├── auth.tsx               # AuthProvider + useAuth
│   ├── theme.tsx              # ThemeProvider
│   ├── store.ts               # Mock data layer (replace with fetch calls)
│   └── use-store.ts           # Subscribe-based selector hook
└── styles.css                 # Design tokens + Tailwind v4 theme
```

### Plugging in a real backend

Everything goes through `src/lib/store.ts`. Replace functions like `listProjects`, `createProject`, `loginUser` etc. with `fetch` calls to your REST API. The auth context in `src/lib/auth.tsx` already manages the session token — just wire `Authorization: Bearer <jwt>` into your fetch wrapper.

---

## REST API

Base URL: `/api/v1`
All non-auth endpoints need `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password, role? }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/logout` | — | 204 |

### Users

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/users/me` | — | `User` |
| PUT | `/users/me` | `{ name?, email?, role? }` | `User` |
| GET | `/users` | — | `User[]` |

### Projects

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/projects?query=` | — | `Project[]` |
| POST | `/projects` | `Project` | `Project` |
| GET | `/projects/:id` | — | `Project` |
| PUT | `/projects/:id` | partial `Project` | `Project` |
| DELETE | `/projects/:id` | — | 204 (cascades tasks) |

### Tasks

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/tasks?projectId=&status=&query=` | — | `Task[]` |
| POST | `/tasks` | `Task` | `Task` |
| GET | `/tasks/:id` | — | `Task` |
| PUT | `/tasks/:id` | partial `Task` | `Task` |
| PATCH | `/tasks/:id/status` | `{ status }` | `Task` |
| DELETE | `/tasks/:id` | — | 204 |

### Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "fields": { "email": "Already taken" }
  }
}
```

---

## Database schema (MySQL)

```
users
  id           CHAR(36) PK
  name         VARCHAR(100)
  email        VARCHAR(255) UNIQUE
  password_hash VARCHAR(255)
  role         VARCHAR(50)
  created_at   DATETIME

projects
  id           CHAR(36) PK
  title        VARCHAR(120)
  description  TEXT
  start_date   DATE
  end_date     DATE
  status       ENUM('Planning','Active','On Hold','Completed')
  owner_id     FK → users.id
  created_at   DATETIME

tasks
  id           CHAR(36) PK
  title        VARCHAR(150)
  description  TEXT
  project_id   FK → projects.id (CASCADE DELETE)
  assignee_id  FK → users.id (SET NULL)
  priority     ENUM('Low','Medium','High')
  status       ENUM('Pending','In Progress','Completed')
  due_date     DATE
  created_at   DATETIME
```

### SQL

```sql
CREATE DATABASE IF NOT EXISTS smart_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_portal;

CREATE TABLE users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(50)   NOT NULL DEFAULT 'Team Member',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE projects (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  description TEXT         NOT NULL,
  start_date  DATE         NOT NULL,
  end_date    DATE         NOT NULL,
  status      ENUM('Planning','Active','On Hold','Completed') NOT NULL DEFAULT 'Planning',
  owner_id    CHAR(36)     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_projects_owner  (owner_id),
  INDEX idx_projects_status (status),
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tasks (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL,
  project_id  CHAR(36)     NOT NULL,
  assignee_id CHAR(36)     NULL,
  priority    ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  status      ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  due_date    DATE         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_project  (project_id),
  INDEX idx_tasks_assignee (assignee_id),
  INDEX idx_tasks_status   (status),
  CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;
```

<details>
<summary>Seed data</summary>

```sql
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('u_demo',  'Demo Admin', 'demo@portal.app',  '$2a$10$...', 'Project Manager'),
  ('u_alice', 'Alice Chen', 'alice@portal.app', '$2a$10$...', 'Designer'),
  ('u_bob',   'Bob Patel',  'bob@portal.app',   '$2a$10$...', 'Developer');

INSERT INTO projects (id, title, description, start_date, end_date, status, owner_id) VALUES
  ('p1', 'Website Redesign',      'Refresh the public marketing site.',  '2026-06-14', '2026-07-19', 'Active',   'u_demo'),
  ('p2', 'Mobile App MVP',        'Ship the first version of the app.',  '2026-05-29', '2026-08-12', 'Active',   'u_demo'),
  ('p3', 'Q4 Marketing Campaign', 'End-of-year promotional push.',       '2026-06-23', '2026-08-27', 'Planning', 'u_demo');

INSERT INTO tasks (id, title, description, project_id, assignee_id, priority, status, due_date) VALUES
  ('t1', 'Audit current site content', 'Inventory all pages and assets.', 'p1', 'u_alice', 'Medium', 'Completed',   '2026-06-21'),
  ('t2', 'Design new homepage',        'Three concepts in Figma.',        'p1', 'u_alice', 'High',   'In Progress', '2026-07-03'),
  ('t3', 'Implement hero section',     'Code the chosen homepage hero.',  'p1', 'u_bob',   'High',   'Pending',     '2026-07-10');
```
</details>

---

## Backend setup

### Spring Boot

```bash
spring init --dependencies=web,data-jpa,security,validation,mysql,lombok smart-portal
```

1. Configure `application.yml` with your MySQL JDBC URL and credentials.
2. Add a JWT filter using the `jjwt` library and a BCrypt password encoder.
3. Map entities and DTOs to the schema above and expose the REST endpoints.
4. Enable CORS for your frontend origin.

### Node/Express alternative

```bash
npm init -y
npm i express mysql2 jsonwebtoken bcryptjs zod cors helmet
```

Use `mysql2/promise` for pooled queries. Issue JWTs on `/auth/login` and verify them via middleware.

---

## Notes

- Single workspace — no multi-tenancy.
- A task belongs to exactly one project and optionally one assignee.
- Hard deletes only — there's a confirm dialog before any destructive action.
- The mock auth in `localStorage` uses base64 purely for the demo. A real backend must use BCrypt or Argon2 with a salt.
- The mock JWT isn't cryptographically signed — replace with a proper HS256 token from your backend.
- Dates are stored as `YYYY-MM-DD` strings throughout.
- Role is a free-text field for now; promote to an enum + roles table when you add proper RBAC.

---

## Pages

| Route | Page |
|---|---|
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Stats + charts overview |
| `/projects` | Projects list |
| `/projects/new` | Create project |
| `/projects/:id/edit` | Edit project |
| `/tasks` | Tasks list |
| `/tasks/new` | Create task |
| `/tasks/:id/edit` | Edit task |
| `/profile` | View and edit profile |
| `*` | 404 |
