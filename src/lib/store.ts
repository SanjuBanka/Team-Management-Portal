// Mock data layer using localStorage. Simulates JWT auth + REST backend.
// In production this would be replaced by API calls to a Spring Boot / Express backend.

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string; // base64 — for demo only
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
}

const KEYS = {
  users: "stmp.users",
  projects: "stmp.projects",
  tasks: "stmp.tasks",
  session: "stmp.session",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("stmp:change", { detail: { key } }));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function hash(pw: string) {
  // demo only — not real cryptography
  if (typeof window === "undefined") return pw;
  return window.btoa(unescape(encodeURIComponent("stmp::" + pw)));
}

function fakeToken(userId: string) {
  const header = window.btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = window.btoa(
    JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }),
  );
  return `${header}.${payload}.demo-signature`;
}

// ---- seeding ----
export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  const users = read<User[]>(KEYS.users, []);
  if (users.length > 0) return;

  const demo: User = {
    id: "u_demo",
    name: "Demo Admin",
    email: "demo@portal.app",
    role: "Project Manager",
    passwordHash: hash("demo1234"),
    createdAt: new Date().toISOString(),
  };
  const alice: User = {
    id: "u_alice",
    name: "Alice Chen",
    email: "alice@portal.app",
    role: "Designer",
    passwordHash: hash("demo1234"),
    createdAt: new Date().toISOString(),
  };
  const bob: User = {
    id: "u_bob",
    name: "Bob Patel",
    email: "bob@portal.app",
    role: "Developer",
    passwordHash: hash("demo1234"),
    createdAt: new Date().toISOString(),
  };
  write(KEYS.users, [demo, alice, bob]);

  const today = new Date();
  const inDays = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);

  const projects: Project[] = [
    {
      id: "p1",
      title: "Website Redesign",
      description: "Refresh the public marketing site with a new brand system.",
      startDate: inDays(-14),
      endDate: inDays(21),
      status: "Active",
      ownerId: demo.id,
      createdAt: new Date().toISOString(),
    },
    {
      id: "p2",
      title: "Mobile App MVP",
      description: "Ship the first version of the customer-facing mobile app.",
      startDate: inDays(-30),
      endDate: inDays(45),
      status: "Active",
      ownerId: demo.id,
      createdAt: new Date().toISOString(),
    },
    {
      id: "p3",
      title: "Q4 Marketing Campaign",
      description: "Plan and execute the end-of-year promotional push.",
      startDate: inDays(-5),
      endDate: inDays(60),
      status: "Planning",
      ownerId: demo.id,
      createdAt: new Date().toISOString(),
    },
  ];
  write(KEYS.projects, projects);

  const tasks: Task[] = [
    { id: "t1", title: "Audit current site content", description: "Inventory all pages and assets.", projectId: "p1", assigneeId: alice.id, priority: "Medium", status: "Completed", dueDate: inDays(-7), createdAt: new Date().toISOString() },
    { id: "t2", title: "Design new homepage", description: "Create three concepts in Figma.", projectId: "p1", assigneeId: alice.id, priority: "High", status: "In Progress", dueDate: inDays(5), createdAt: new Date().toISOString() },
    { id: "t3", title: "Implement hero section", description: "Code the chosen homepage hero.", projectId: "p1", assigneeId: bob.id, priority: "High", status: "Pending", dueDate: inDays(12), createdAt: new Date().toISOString() },
    { id: "t4", title: "Set up CI pipeline", description: "GitHub Actions for build + test.", projectId: "p2", assigneeId: bob.id, priority: "Medium", status: "Completed", dueDate: inDays(-2), createdAt: new Date().toISOString() },
    { id: "t5", title: "Auth flow screens", description: "Login, register, forgot password.", projectId: "p2", assigneeId: alice.id, priority: "High", status: "In Progress", dueDate: inDays(8), createdAt: new Date().toISOString() },
    { id: "t6", title: "Push notifications", description: "Wire up FCM for Android + APNs for iOS.", projectId: "p2", assigneeId: bob.id, priority: "Low", status: "Pending", dueDate: inDays(20), createdAt: new Date().toISOString() },
    { id: "t7", title: "Draft campaign brief", description: "Goals, audience, channels.", projectId: "p3", assigneeId: demo.id, priority: "Medium", status: "Pending", dueDate: inDays(7), createdAt: new Date().toISOString() },
    { id: "t8", title: "Source social creative", description: "Brief external agency.", projectId: "p3", assigneeId: alice.id, priority: "Low", status: "Pending", dueDate: inDays(15), createdAt: new Date().toISOString() },
  ];
  write(KEYS.tasks, tasks);
}

// ---- users / auth ----
export interface Session {
  token: string;
  userId: string;
}

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function getCurrentUser(): User | null {
  const s = getSession();
  if (!s) return null;
  return read<User[]>(KEYS.users, []).find((u) => u.id === s.userId) ?? null;
}

export function listUsers(): User[] {
  return read<User[]>(KEYS.users, []);
}

export function registerUser(input: { name: string; email: string; password: string; role?: string }): User {
  const users = read<User[]>(KEYS.users, []);
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const user: User = {
    id: uid(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role?.trim() || "Team Member",
    passwordHash: hash(input.password),
    createdAt: new Date().toISOString(),
  };
  write(KEYS.users, [...users, user]);
  write<Session>(KEYS.session, { token: fakeToken(user.id), userId: user.id });
  return user;
}

export function loginUser(email: string, password: string): User {
  const users = read<User[]>(KEYS.users, []);
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hash(password)) {
    throw new Error("Invalid email or password.");
  }
  write<Session>(KEYS.session, { token: fakeToken(user.id), userId: user.id });
  return user;
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.session);
  window.dispatchEvent(new CustomEvent("stmp:change", { detail: { key: KEYS.session } }));
}

export function updateProfile(updates: Partial<Pick<User, "name" | "email" | "role">>): User {
  const session = getSession();
  if (!session) throw new Error("Not authenticated");
  const users = read<User[]>(KEYS.users, []);
  const idx = users.findIndex((u) => u.id === session.userId);
  if (idx === -1) throw new Error("User not found");
  const updated = { ...users[idx], ...updates };
  users[idx] = updated;
  write(KEYS.users, users);
  return updated;
}

// ---- projects ----
export function listProjects(): Project[] {
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    // synchronous fallback: return local cache immediately; UI should call a refresh via separate API calls
    return read<Project[]>(KEYS.projects, []);
  }
  return read<Project[]>(KEYS.projects, []);
}

export function getProject(id: string): Project | undefined {
  return listProjects().find((p) => p.id === id);
}

export function createProject(input: Omit<Project, "id" | "createdAt" | "ownerId">): Project {
  const session = getSession();
  const project: Project = {
    ...input,
    id: uid(),
    ownerId: session?.userId ?? "u_demo",
    createdAt: new Date().toISOString(),
  };
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    // attempt remote create, but keep local fallback
    try {
      void fetch(`${api.replace(/\/$/, '')}/api/projects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }).then(async (res) => {
        if (res.ok) {
          const remote = await res.json();
          write(KEYS.projects, [remote, ...listProjects()]);
        }
      });
    } catch (e) {
      /* ignore */
    }
  }
  write(KEYS.projects, [project, ...listProjects()]);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const projects = listProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Project not found");
  projects[idx] = { ...projects[idx], ...updates };
  write(KEYS.projects, projects);
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    try {
      void fetch(`${api.replace(/\/$/, '')}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      /* ignore */
    }
  }
  return projects[idx];
}

export function deleteProject(id: string) {
  write(
    KEYS.projects,
    listProjects().filter((p) => p.id !== id),
  );
  // cascade delete tasks
  write(
    KEYS.tasks,
    listTasks().filter((t) => t.projectId !== id),
  );
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    try {
      void fetch(`${api.replace(/\/$/, '')}/api/projects/${id}`, { method: 'DELETE' });
    } catch (e) {
      /* ignore */
    }
  }
}

// ---- tasks ----
export function listTasks(): Task[] {
  return read<Task[]>(KEYS.tasks, []);
}

export function getTask(id: string): Task | undefined {
  return listTasks().find((t) => t.id === id);
}

export function createTask(input: Omit<Task, "id" | "createdAt">): Task {
  const task: Task = { ...input, id: uid(), createdAt: new Date().toISOString() };
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    try {
      void fetch(`${api.replace(/\/$/, '')}/api/tasks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }).then(async (res) => {
        if (res.ok) {
          const remote = await res.json();
          write(KEYS.tasks, [remote, ...listTasks()]);
        }
      });
    } catch (e) {
      /* ignore */
    }
  }
  write(KEYS.tasks, [task, ...listTasks()]);
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task {
  const tasks = listTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Task not found");
  tasks[idx] = { ...tasks[idx], ...updates };
  write(KEYS.tasks, tasks);
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (api) {
    try {
      void fetch(`${api.replace(/\/$/, '')}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      /* ignore */
    }
  }
  return tasks[idx];
}

export function deleteTask(id: string) {
  write(
    KEYS.tasks,
    listTasks().filter((t) => t.id !== id),
  );
}

// ---- subscriptions (very small pub/sub for react) ----
export function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("stmp:change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("stmp:change", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function syncFromApi(): Promise<void> {
  const api = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (!api || typeof window === 'undefined') return;
  const base = api.replace(/\/$/, '');
  try {
    const [projectsRes, tasksRes, usersRes] = await Promise.all([
      fetch(`${base}/api/projects`),
      fetch(`${base}/api/tasks`),
      fetch(`${base}/api/users`),
    ]);
    if (projectsRes.ok) {
      const projects = await projectsRes.json();
      write(KEYS.projects, projects);
    }
    if (tasksRes.ok) {
      const tasks = await tasksRes.json();
      write(KEYS.tasks, tasks);
    }
    if (usersRes.ok) {
      const users = await usersRes.json();
      write(KEYS.users, users.map(u => ({ ...u, passwordHash: 'hidden' })));
    }
  } catch (e) {
    // ignore network errors — keep local cache
  }
}