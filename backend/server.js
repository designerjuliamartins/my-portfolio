const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');
const PRIVATE_DIR = path.join(__dirname, 'server-private');
const PORT = process.env.PORT || 3000;

// Never hardcode the real password here — this repo is public.
// Set CASE_STUDY_PASSWORD before starting the server; if it's not set,
// generate a random one for this process and print it once so local
// dev still works without committing a secret to source.
const PASSWORD = process.env.CASE_STUDY_PASSWORD || crypto.randomBytes(4).toString('hex');
if (!process.env.CASE_STUDY_PASSWORD) {
  console.log(`No CASE_STUDY_PASSWORD set — generated one for this process: ${PASSWORD}`);
}

// Signs the auth cookie so it can't be forged without this secret.
// Set COOKIE_SECRET in production so sessions survive a server restart.
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.COOKIE_SECRET) {
  console.log('No COOKIE_SECRET set — using a random one for this process (sessions reset on restart).');
}

const COOKIE_NAME = 'cs_auth';
const AUTH_PAYLOAD = 'lendable-mexico-unlocked';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sign(value) {
  return crypto.createHmac('sha256', COOKIE_SECRET).update(value).digest('hex');
}

function isAuthed(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const expected = sign(AUTH_PAYLOAD);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function sendFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      return;
    }
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1e5) { // 100kb guard
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Serves static files from frontend/ only — server-private/ lives under
// backend/ (a separate tree entirely), which is what actually keeps the
// case study content out of the client's hands until it's authorized.
function serveStatic(req, res, pathname) {
  let relPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const resolved = path.normalize(path.join(PUBLIC_DIR, relPath));

  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    sendFile(res, resolved);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && (pathname === '/lendable-mexico' || pathname === '/lendable-mexico.html')) {
    const filePath = isAuthed(req)
      ? path.join(PRIVATE_DIR, 'case-study-content.html')
      : path.join(PRIVATE_DIR, 'lock-screen.html');
    sendFile(res, filePath);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/unlock') {
    try {
      const raw = await readBody(req);
      const { password } = JSON.parse(raw || '{}');
      const a = Buffer.from(String(password || ''));
      const b = Buffer.from(PASSWORD);
      const match = a.length === b.length && crypto.timingSafeEqual(a, b);

      if (!match) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Wrong password. Try again.' }));
        return;
      }

      const token = sign(AUTH_PAYLOAD);
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    }
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res, pathname);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
