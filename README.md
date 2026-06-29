# Smart Task & Team Management Portal

A clean, dashboard-style web application for managing projects, tasks, and teams.

> **About this build.** The frontend is fully implemented in React (TanStack
> Start) with mock data persisted to `localStorage`, so every UI flow works
> end-to-end in the browser. The original brief asked for **Java Spring Boot
> or Node.js Express + MySQL** on the backend — that backend is not bundled
> here, but this README documents the schema, REST API, and architecture
> needed to wire it up. The frontend layer is structured so swapping the
> mock `src/lib/store.ts` for real `fetch` calls is a one-file change.

---

## Tech stack

| Layer | What's used here | What the spec asked for |
| --- | --- | --- |
| Frontend | React 19 + TanStack Start (Vite 7) + Tailwind v4 + shadcn/ui + Recharts + react-hook-form + Zod + sonner | React.js ✓ |
| Auth | JWT-shaped tokens minted client-side, stored in `localStorage` (mock) | JWT login/register ✓ (mock — swap for real backend) |
| State | Lightweight store + pub/sub over `localStorage` | — |
| Backend | **Not bundled.** Reference design in this README. | Java Spring Boot / Node Express |
| Database | **Not bundled.** Reference schema + sample SQL below. | MySQL |

---

## Features

### Authentication
- Register, login, logout
- JWT-shaped session tokens
- Password hashing (demo uses base64; real backend should use BCrypt / Argon2)
- Protected routes via `_authenticated` layout
- Toast notifications + form validation

### Dashboard
- Total projects, total tasks, completed tasks, pending tasks
- Tasks-by-project stacked bar chart
- Status breakdown pie chart
- Upcoming tasks list
- Active projects progress

### Projects
- Create / read / update / delete
- Search by title, description, or status
- Project fields: title, description, start date, end date, status
- Cascading delete of tasks

### Tasks
- Create / read / update / delete
- Assign to a user
- Inline status change (Pending / In Progress / Completed)
- Priority: Low / Medium / High
- Due date
- Filter by status, project, and free-text search

### Profile
- View user details
- Edit name, email, role

### UX polish
- Responsive: mobile, tablet, desktop
- Dark mode toggle
- Collapsible sidebar
- Loading indicators
- Confirmation dialogs for destructive actions
- Empty states
- 404 page

---

## Running the frontend

```bash
bun install
bun run dev
# open the printed URL
```

Demo credentials are seeded automatically:

- **Email:** `demo@portal.app`
- **Password:** `demo1234`

Two additional sample users (`alice@portal.app`, `bob@portal.app`, same password) and three projects with eight tasks are seeded on first load so the dashboard is populated immediately.

---

## Project architecture

```
src/
├── routes/                    # File-based routing (TanStack Router)
│   ├── __root.tsx             # App shell + providers (theme, auth, query, toaster)
│   ├── index.tsx              # /  → redirects to /dashboard
│   ├── login.tsx              # /login
│   ├── register.tsx           # /register
│   ├── _authenticated.tsx     # Protected layout (sidebar + topbar shell)
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
│   ├── layout/                # sidebar, topbar, stat cards, status badges, empty states
│   └── forms/                 # project + task form components
├── lib/
│   ├── auth.tsx               # AuthProvider + useAuth hook
│   ├── theme.tsx              # ThemeProvider (dark/light)
│   ├── store.ts               # Mock data layer (swap for fetch calls)
│   └── use-store.ts           # Tiny subscribe-based selector hook
└── styles.css                 # Design tokens (oklch) + Tailwind v4 theme
```

### Where to plug in a real backend

Every data call in the UI goes through `src/lib/store.ts`. Replace the
function bodies (`listProjects`, `createProject`, `loginUser`, …) with
`fetch` calls against your REST API. The auth context (`src/lib/auth.tsx`)
already centralizes the session token — wire `Authorization: Bearer <jwt>`
into your fetch wrapper.

---

## REST API (reference design)

Base URL: `/api/v1`. All non-auth endpoints require `Authorization: Bearer <jwt>`.

### Auth
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ name, email, password, role? }` | `{ token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user }` |
| `POST` | `/auth/logout` | — | `204` |

### Users
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/users/me` | — | `User` |
| `PUT` | `/users/me` | `{ name?, email?, role? }` | `User` |
| `GET` | `/users` | — | `User[]` (for assignee picker) |

### Projects
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/projects?query=…` | — | `Project[]` |
| `POST` | `/projects` | `Project` | `Project` |
| `GET` | `/projects/:id` | — | `Project` |
| `PUT` | `/projects/:id` | partial `Project` | `Project` |
| `DELETE` | `/projects/:id` | — | `204` (cascades tasks) |

### Tasks
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/tasks?projectId=&status=&query=` | — | `Task[]` |
| `POST` | `/tasks` | `Task` | `Task` |
| `GET` | `/tasks/:id` | — | `Task` |
| `PUT` | `/tasks/:id` | partial `Task` | `Task` |
| `PATCH` | `/tasks/:id/status` | `{ status }` | `Task` |
| `DELETE` | `/tasks/:id` | — | `204` |

### Error shape
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

---

## Database design (MySQL)

```text
┌───────────┐        ┌───────────┐        ┌───────────┐
│  users    │ 1──┐   │ projects  │ 1──┐   │  tasks    │
│-----------│    │   │-----------│    │   │-----------│
│ id  PK    │    │   │ id  PK    │    └──>│ project_id│
│ name      │    │   │ title     │        │ assignee_id ──┐
│ email UK  │    │   │ description│       │ title          │
│ password  │    │   │ start_date │       │ description    │
│ role      │    └──>│ owner_id   │       │ priority       │
│ created_at│        │ end_date   │       │ status         │
└───────────┘        │ status     │       │ due_date       │
                     │ created_at │       │ created_at     │
                     └───────────┘        └────────────────┘
                                                 │
                                                 └── FK to users.id
```

### Sample SQL script

```sql
-- schema.sql
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
  INDEX idx_projects_owner (owner_id),
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
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_assignee (assignee_id),
  INDEX idx_tasks_status (status),
  CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- seed.sql
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('u_demo',  'Demo Admin', 'demo@portal.app',  '$2a$10$bcryptHash...', 'Project Manager'),
  ('u_alice', 'Alice Chen', 'alice@portal.app', '$2a$10$bcryptHash...', 'Designer'),
  ('u_bob',   'Bob Patel',  'bob@portal.app',   '$2a$10$bcryptHash...', 'Developer');

INSERT INTO projects (id, title, description, start_date, end_date, status, owner_id) VALUES
  ('p1', 'Website Redesign',     'Refresh the public marketing site.',     '2026-06-14', '2026-07-19', 'Active',   'u_demo'),
  ('p2', 'Mobile App MVP',       'Ship the first version of the app.',     '2026-05-29', '2026-08-12', 'Active',   'u_demo'),
  ('p3', 'Q4 Marketing Campaign','End-of-year promotional push.',          '2026-06-23', '2026-08-27', 'Planning', 'u_demo');

INSERT INTO tasks (id, title, description, project_id, assignee_id, priority, status, due_date) VALUES
  ('t1', 'Audit current site content', 'Inventory all pages and assets.', 'p1', 'u_alice', 'Medium', 'Completed',   '2026-06-21'),
  ('t2', 'Design new homepage',        'Three concepts in Figma.',         'p1', 'u_alice', 'High',   'In Progress', '2026-07-03'),
  ('t3', 'Implement hero section',     'Code the chosen homepage hero.',   'p1', 'u_bob',   'High',   'Pending',     '2026-07-10');
```

---

## Backend setup (reference)

### Java Spring Boot
1. `spring init --dependencies=web,data-jpa,security,validation,mysql,lombok smart-portal`
2. Configure `application.yml` with MySQL JDBC URL.
3. Add a JWT filter (`jjwt` library) + BCrypt password encoder.
4. Map the entities/DTOs to the schema above; expose the REST endpoints from the API table.
5. Enable CORS for the frontend origin.

### Node Express alternative
1. `npm init -y && npm i express mysql2 jsonwebtoken bcryptjs zod cors helmet`
2. Use `mysql2/promise` for pooled queries against the schema above.
3. Issue JWTs on `/auth/login` and verify them in a middleware.

---

## Assumptions

- One workspace per deployment (no multi-tenancy).
- A task belongs to exactly one project and zero or one assignee.
- Soft delete is not required — destructive actions confirm via modal then hard delete.
- Demo passwords are stored as base64-encoded strings in `localStorage` purely so the in-browser auth flow works end-to-end. A real backend MUST use BCrypt/Argon2 hashing with a salt.
- The mock JWT in `src/lib/store.ts` is not cryptographically signed; replace with a real `HS256` token from your backend.
- All dates are stored as ISO `YYYY-MM-DD` strings.
- Role is a free-text string today; promote to an enum + `user_roles` join table when adding RBAC.

---

## Pages

| Route | Page |
| --- | --- |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Dashboard with stats + charts |
| `/projects` | Projects list (searchable) |
| `/projects/new` | Create project |
| `/projects/:projectId/edit` | Edit project |
| `/tasks` | Tasks list (filter + search) |
| `/tasks/new` | Create task |
| `/tasks/:taskId/edit` | Edit task |
| `/profile` | View & edit profile |
| `*` | 404 page |

---

## License

MIT — built as a 48-hour evaluation reference project.
