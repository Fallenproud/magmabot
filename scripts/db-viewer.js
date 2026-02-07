import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = 18790;
const STATE_DIR = path.join(os.homedir(), '.openclaw');
const DB_PATH = path.join(STATE_DIR, 'memory', 'main.sqlite');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    serveIndex(res);
  } else if (url.pathname.startsWith('/table/')) {
    const tableName = url.pathname.split('/')[2];
    serveTable(res, tableName);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function serveIndex(res) {
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
          <p>Database not found at: <br><code>${DB_PATH}</code></p>
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
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    let tableHtml = "";
    for (const table of tables) {
      const name = table.name;
      const count = db.prepare("SELECT COUNT(*) as c FROM " + name).get().c;
      tableHtml += `
        <div class="table-card">
          <h3>${name} (${count} rows)</h3>
          <a href="/table/${name}">View Data</a>
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
    res.end("Error: " + err.message);
  } finally {
    if (db) db.close();
  }
}

function serveTable(res, tableName) {
  let db;
  try {
    db = new DatabaseSync(DB_PATH);
    const data = db.prepare("SELECT * FROM " + tableName + " LIMIT 100").all();

    let headers = "";
    let rows = "";

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      headers = keys.map(k => `<th>${k}</th>`).join("");
      rows = data.map(row => `<tr>${keys.map(k => {
        let val = row[k];
        if (typeof val === 'string' && val.length > 100) val = val.substring(0, 100) + "...";
        return `<td>${val}</td>`;
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
        <title>${tableName} - MagmaBot DB</title>
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
        <a href="/" class="back"><- Back to Overview</a>
        <h1>Table: ${tableName}</h1>
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
    res.end("Error: " + err.message);
  } finally {
    if (db) db.close();
  }
}

server.listen(PORT, () => {
  console.log(`MagmaBot DB Explorer running at http://localhost:${PORT}`);
});
