const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());

// Serve Parcel-built static files
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ===== HELPER: read/write JSON files =====
function readJSON(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ===== API ROUTES =====

// --- Newsletter / Waitlist signup ---
app.post('/api/subscribe', (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const subs = readJSON('subscribers.json');
  if (subs.find(s => s.email === email)) {
    return res.status(409).json({ error: 'Already subscribed' });
  }
  subs.push({ email, name: name || '', subscribedAt: new Date().toISOString() });
  writeJSON('subscribers.json', subs);
  res.json({ message: 'Subscribed successfully!', count: subs.length });
});

app.get('/api/subscribers/count', (req, res) => {
  const subs = readJSON('subscribers.json');
  res.json({ count: subs.length });
});

// --- Contact form ---
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const contacts = readJSON('contacts.json');
  contacts.push({ name, email, message, sentAt: new Date().toISOString(), read: false });
  writeJSON('contacts.json', contacts);
  res.json({ message: 'Message received! We\'ll get back to you soon.' });
});

// --- Success stories ---
app.get('/api/stories', (req, res) => {
  const stories = readJSON('stories.json');
  res.json(stories);
});

app.post('/api/stories', (req, res) => {
  const { name, role, company, text, tools } = req.body;
  if (!name || !role || !text) {
    return res.status(400).json({ error: 'Name, role, and story text are required' });
  }
  const stories = readJSON('stories.json');
  stories.push({
    id: Date.now().toString(36),
    name, role, company: company || '',
    text, tools: tools || [],
    createdAt: new Date().toISOString(),
    approved: false
  });
  writeJSON('stories.json', stories);
  res.json({ message: 'Story submitted for review!' });
});

// --- Stats endpoint ---
app.get('/api/stats', (req, res) => {
  const subs = readJSON('subscribers.json');
  const stories = readJSON('stories.json');
  const contacts = readJSON('contacts.json');
  res.json({
    subscribers: subs.length,
    stories: stories.length,
    contacts: contacts.length,
    engineers: 100000 + subs.length,
    tools: 6,
    resources: 1000,
    companies: 70
  });
});

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// SPA fallback — serve index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Let's Code server running at http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`⚡ Health check: http://localhost:${PORT}/api/health\n`);
});
