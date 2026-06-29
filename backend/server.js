import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'root';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'taskcraft';

let pool;

async function initDb() {
  // create database if not exists then create tables
  const rootConn = await mysql.createConnection({ host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
  await rootConn.end();

  pool = mysql.createPool({ host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABASE, connectionLimit: 10 });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      role VARCHAR(64),
      passwordHash VARCHAR(255),
      createdAt DATETIME
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      startDate DATE,
      endDate DATE,
      status VARCHAR(32),
      ownerId VARCHAR(64),
      createdAt DATETIME,
      FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      projectId VARCHAR(64),
      assigneeId VARCHAR(64),
      priority VARCHAR(32),
      status VARCHAR(32),
      dueDate DATE,
      createdAt DATETIME,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // seed minimal data if empty
  const [users] = await pool.query('SELECT COUNT(*) as c FROM users');
  const userCount = Array.isArray(users) && users.length > 0 ? users[0].c : 0;
  if (userCount === 0) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query('INSERT INTO users (id,name,email,role,passwordHash,createdAt) VALUES (?, ?, ?, ?, ?, ?)', ['u_demo', 'Demo Admin', 'demo@portal.app', 'Project Manager', 'root', now]);
    await pool.query('INSERT INTO users (id,name,email,role,passwordHash,createdAt) VALUES (?, ?, ?, ?, ?, ?)', ['u_alice', 'Alice Chen', 'alice@portal.app', 'Designer', 'root', now]);
    await pool.query('INSERT INTO users (id,name,email,role,passwordHash,createdAt) VALUES (?, ?, ?, ?, ?, ?)', ['u_bob', 'Bob Patel', 'bob@portal.app', 'Developer', 'root', now]);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// helper to map row results
function stripPassword(u) {
  const copy = { ...u };
  delete copy.passwordHash;
  return copy;
}

// ----- auth -----
app.get('/api/users', async (req, res) => {
  const [rows] = await pool.query('SELECT id,name,email,role,createdAt FROM users');
  res.json(rows);
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return res.status(409).json({ error: 'user exists' });
  const id = uid();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query('INSERT INTO users (id,name,email,role,passwordHash,createdAt) VALUES (?, ?, ?, ?, ?, ?)', [id, name || email.split('@')[0], email, 'Team Member', password, now]);
  res.json({ token: id, user: { id, name: name || email.split('@')[0], email } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT id,name,email,role,createdAt FROM users WHERE email = ? AND passwordHash = ?', [email, password]);
  if (rows.length === 0) return res.status(401).json({ error: 'invalid credentials' });
  const user = rows[0];
  res.json({ token: user.id, user });
});

// ----- projects -----
app.get('/api/projects', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM projects ORDER BY createdAt DESC');
  res.json(rows);
});

app.get('/api/projects/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.post('/api/projects', async (req, res) => {
  const input = req.body;
  const id = uid();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query('INSERT INTO projects (id,title,description,startDate,endDate,status,ownerId,createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, input.title, input.description, input.startDate, input.endDate, input.status, input.ownerId || 'u_demo', now]);
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  res.json(rows[0]);
});

app.put('/api/projects/:id', async (req, res) => {
  const updates = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'no updates' });
  const sets = fields.map(f => `\`${f}\` = ?`).join(', ');
  await pool.query(`UPDATE projects SET ${sets} WHERE id = ?`, [...fields.map(k => updates[k]), req.params.id]);
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/api/projects/:id', async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
  await pool.query('DELETE FROM tasks WHERE projectId = ?', [req.params.id]);
  res.json({ ok: true });
});

// ----- tasks -----
app.get('/api/tasks', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY createdAt DESC');
  res.json(rows);
});

app.get('/api/tasks/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.post('/api/tasks', async (req, res) => {
  const input = req.body;
  const id = uid();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query('INSERT INTO tasks (id,title,description,projectId,assigneeId,priority,status,dueDate,createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, input.title, input.description, input.projectId, input.assigneeId, input.priority, input.status, input.dueDate, now]);
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  res.json(rows[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const updates = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'no updates' });
  const sets = fields.map(f => `\`${f}\` = ?`).join(', ');
  await pool.query(`UPDATE tasks SET ${sets} WHERE id = ?`, [...fields.map(k => updates[k]), req.params.id]);
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Taskcraft backend listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB', err);
  process.exit(1);
});
