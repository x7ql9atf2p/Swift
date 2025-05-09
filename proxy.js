// SETTINGS
const PORT = 8080;
const SECRET_PASSWORD = 'examplepassword';
const TOKEN_LENGTH = 2048;
const MAX_USERS = 100;

// MAIN SCRIPT
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const userStore = new Map(); // username -> token

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIR = path.join(__dirname, 'web');

function generateToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

function serveStatic(reqPath, res) {
  const normalizedPath = path.normalize(reqPath === '/' ? '/index.html' : reqPath);
  const filePath = path.join(WEB_DIR, normalizedPath);

  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch {
      callback(new Error('Invalid JSON'));
    }
  });
}

http.createServer((req, res) => {
  if (req.url === '/api/new' && req.method === 'POST') {
    parseBody(req, (err, data) => {
      if (err || typeof data.username !== 'string' || typeof data.authentication !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Invalid request format' }));
      }

      const { username, authentication } = data;

      if (authentication !== SECRET_PASSWORD) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Forbidden: Invalid authentication' }));
      }

      if (userStore.has(username)) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Username already exists' }));
      }

      if (userStore.size >= MAX_USERS) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'User limit reached' }));
      }

      const token = generateToken(TOKEN_LENGTH);
      userStore.set(username, token);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, token }));
    });

  } else if (req.url === '/api/authenticate' && req.method === 'POST') {
    parseBody(req, (err, data) => {
      if (err || typeof data.username !== 'string' || typeof data.token !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Invalid request format' }));
      }

      const storedToken = userStore.get(data.username);
      const isValid = storedToken === data.token;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: isValid }));
    });

  } else if (req.url.startsWith('/api')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }));
  } else {
    serveStatic(req.url, res);
  }
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
