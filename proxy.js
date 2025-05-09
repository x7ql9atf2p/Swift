import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const PORT = 8080;
const SECRET_PASSWORD = 'examplepassword';
const TOKEN_LENGTH = 2048;

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIR = path.join(__dirname, 'web');

// Token generator
function generateToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// Serve static file from /web
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

// Create HTTP server
http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    if (req.method === 'POST' && req.url === '/api/new') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.authentication !== SECRET_PASSWORD) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Forbidden: Invalid authentication' }));
            return;
          }

          const token = generateToken(TOKEN_LENGTH);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON or malformed request' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Not Found' }));
    }
  } else {
    serveStatic(req.url, res);
  }
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
