import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = 18790;
const STATE_DIR = path.join(os.homedir(), '.openclaw');
const DB_PATH = path.join(STATE_DIR, 'memory', 'main.sqlite');

// ---------- Auth ----------
// Load token from .env or fall back to env var
function loadEnvToken() {
  // Check process.env first
  if (process.env.MAGMABOT_TOKEN) {
    return process.env.MAGMABOT_TOKEN;
  }
  // Try to read .env from the project root
  const envPath = path.resolve(import.meta.dirname || '.', '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^MAGMABOT_TOKEN=(.+)$/);
      if (match) return match[1].trim();
    }
  }
  return null;
}

const AUTH_TOKEN = loadEnvToken();

function checkAuth(req, res) {
  if (!AUTH_TOKEN) return true; // No token configured, allow (dev mode)
  const url = new URL(req.url, `http://localhost:${PORT}`);
  // Check query param
  const token = url.searchParams.get('token');
  if (token === AUTH_TOKEN) return true;
  // Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === AUTH_TOKEN) return true;
  res.writeHead(401, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MagmaBot DB Explorer - Unauthorized</title>
      <style>
        body { background: #050505; color: #ff4500; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #111; padding: 2rem; border-radius: 8px; border: 1px solid #ff3300; text-align: center; max-width: 400px; }
        h1 { margin-top: 0; font-size: 1.4rem; }
        code { background: #222; padding: 0.2rem 0.5rem; border-radius: 3px; color: #ff9900; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🔒 Access Denied</h1>
        <p>Provide a valid token via <code>?token=YOUR_TOKEN</code></p>
      </div>
    </body>
    </html>
  `);
  return false;
}

// ---------- Safety helpers ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getValidTableNames(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
}

// ---------- Server ----------
const server = http.createServer((req, res) => {
  if (!checkAuth(req, res)) return;

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    serveIndex(res, url);
  } else if (url.pathname.startsWith('/table/')) {
    const tableName = decodeURIComponent(url.pathname.split('/')[2]);
    serveTable(res, tableName, url);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function tokenQuery(url) {
  const t = url.searchParams.get('token');
  return t ? `?token=${encodeURIComponent(t)}` : '';
}

function serveIndex(res, url) {
  if (!fs.existsSync(DB_PATH)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MagmaBot DB Explorer</title>
        <style>
          body { background: #050505; color: #ff4500; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #111; padding: 2rem; border-radius: 8px; border: 1px solid #333; text-align: center; }
          h1 { margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>MagmaBot DB Explorer</h1>
          <p>Database not found at: <br><code>${escapeHtml(DB_PATH)}</code></p>
          <p>Please start MagmaBot and perform a memory sync first.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  let db;
  try {
    db = new DatabaseSync(DB_PATH);
    const tables = getValidTableNames(db);
    const tq = tokenQuery(url);

    let tableHtml = "";
    for (const name of tables) {
      const count = db.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get().c;
      tableHtml += `
        <div class="table-card">
          <h3>${escapeHtml(name)} (${count} rows)</h3>
          <a href="/table/${encodeURIComponent(name)}${tq}">View Data</a>
        </div>
      `;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MagmaBot DB Explorer</title>
        <style>
          body { background: #050505; color: #eee; font-family: sans-serif; margin: 0; padding: 2rem; }
          h1 { color: #ff3300; border-bottom: 2px solid #ff3300; padding-bottom: 0.5rem; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem; }
          .table-card { background: #111; padding: 1.5rem; border: 1px solid #333; border-radius: 8px; transition: 0.2s; }
          .table-card:hover { border-color: #ff3300; transform: translateY(-2px); }
          .table-card h3 { margin: 0; color: #ff9900; }
          .table-card a { display: inline-block; margin-top: 1rem; color: #fff; text-decoration: none; background: #ff3300; padding: 0.4rem 1rem; border-radius: 4px; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <h1>MagmaBot Command Center - Database Explorer</h1>
        <div class="grid">${tableHtml}</div>
      </body>
      </html>
    `);
  } catch (err) {
    res.writeHead(500);
    res.end("Error: " + escapeHtml(err.message));
  } finally {
    if (db) db.close();
  }
}

function serveTable(res, tableName, url) {
  let db;
  try {
    db = new DatabaseSync(DB_PATH);

    // Validate table name against actual tables (prevents SQL injection)
    const validTables = getValidTableNames(db);
    if (!validTables.includes(tableName)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Not Found</title>
        <style>body { background: #050505; color: #ff4500; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }</style>
        </head>
        <body><h1>Table "${escapeHtml(tableName)}" not found</h1></body>
        </html>
      `);
      return;
    }

    const data = db.prepare(`SELECT * FROM "${tableName}" LIMIT 100`).all();
    const tq = tokenQuery(url);

    let headers = "";
    let rows = "";

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      headers = keys.map(k => `<th>${escapeHtml(k)}</th>`).join("");
      rows = data.map(row => `<tr>${keys.map(k => {
        let val = row[k];
        if (typeof val === 'string' && val.length > 100) val = val.substring(0, 100) + "...";
        return `<td>${escapeHtml(val)}</td>`;
      }).join("")}</tr>`).join("");
    } else {
      headers = "<th>No data</th>";
      rows = "<tr><td>Table is empty</td></tr>";
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(tableName)} - MagmaBot DB</title>
        <style>
          body { background: #050505; color: #eee; font-family: sans-serif; margin: 0; padding: 1rem; }
          h1 { color: #ff3300; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #111; }
          th, td { border: 1px solid #333; padding: 0.5rem; text-align: left; font-size: 0.85rem; }
          th { background: #222; color: #ff9900; }
          tr:hover { background: #1a1a1a; }
          .back { color: #ff3300; text-decoration: none; margin-bottom: 1rem; display: inline-block; }
        </style>
      </head>
      <body>
        <a href="/${tq}" class="back"><- Back to Overview</a>
        <h1>Table: ${escapeHtml(tableName)}</h1>
        <div style="overflow-x: auto;">
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.writeHead(500);
    res.end("Error: " + escapeHtml(err.message));
  } finally {
    if (db) db.close();
  }
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`MagmaBot DB Explorer running at http://127.0.0.1:${PORT}`);
  if (AUTH_TOKEN) {
    console.log(`Auth enabled — use ?token=<token> or Authorization: Bearer <token>`);
  } else {
    console.log(`⚠ No auth token found — running in open mode`);
  }
});
