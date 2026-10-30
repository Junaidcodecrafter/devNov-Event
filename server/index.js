const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'), Database = require('better-sqlite3');
const SECRET = process.env.JWT_SECRET || 'devnov-dev-secret';
const db = new Database(__dirname + '/devnov.db');

// ---------- DATA TIER ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, college TEXT, password TEXT);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, title TEXT, category TEXT, tag TEXT, emoji TEXT,
  description TEXT, date TEXT, venue TEXT, capacity INTEGER);
CREATE TABLE IF NOT EXISTS registrations(user_id INTEGER, event_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, event_id));`);
if (!db.prepare('SELECT COUNT(*) c FROM events').get().c) {
  const ins = db.prepare('INSERT INTO events(title,category,tag,emoji,description,date,venue,capacity) VALUES(?,?,?,?,?,?,?,?)');
  [
    ['24-Hour Hackathon', 'tech', 'Hackathon', '💻', 'Teams of 4 build a working product around a surprise theme. Mentors on call all night.', '2026-11-14T09:00', 'Innovation Lab', 120],
    ['Build with AI Workshop', 'tech', 'Workshop', '🤖', 'Hands-on session: ship an LLM-powered app from scratch in three hours.', '2026-11-16T14:00', 'Seminar Hall A', 80],
    ['Capture The Flag', 'tech', 'Competition', '🚩', 'Crack web, crypto and forensics puzzles. Solo or pairs.', '2026-11-20T10:00', 'Computer Lab 3', 60],
    ['Open Source Sprint', 'tech', 'Sprint', '🌱', 'Make your first pull request with maintainers guiding you.', '2026-11-22T11:00', 'Library Annex', 50],
    ['Street Play Showdown', 'non-tech', 'Drama', '🎭', 'Eight minutes, one message, no props. Perform a street play for the campus crowd.', '2026-11-15T16:00', 'Central Quad', 100],
    ['Open Mic Night', 'non-tech', 'Music', '🎤', 'Sing, rap, recite or do stand-up. Sign up for a five-minute slot.', '2026-11-18T18:30', 'Amphitheatre', 90],
    ['Photo Walk: Old Town', 'non-tech', 'Photography', '📷', 'Walk, shoot and vote on the best frame. Phone cameras welcome.', '2026-11-21T07:30', 'Main Gate', 40],
    ['Parliamentary Debate', 'non-tech', 'Debate', '🗣️', 'Argue the motion you are given, not the one you believe in.', '2026-11-23T10:00', 'Seminar Hall B', 64],
  ].forEach(r => ins.run(...r));
}

// ---------- APPLICATION TIER ----------
const app = express();
app.use(cors(), express.json());
const sign = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u.id, name: u.name, email: u.email, college: u.college });
const auth = (required) => (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(t, SECRET); } catch { if (required) return res.status(401).json({ error: 'Please log in first' }); }
  next();
};

app.post('/api/signup', (req, res) => {
  const { name, email, password, college } = req.body || {};
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Fill every field. Password needs 6+ characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.toLowerCase())) return res.status(409).json({ error: 'That email already has an account. Log in instead.' });
  const id = db.prepare('INSERT INTO users(name,email,college,password) VALUES(?,?,?,?)')
    .run(name.trim(), email.toLowerCase(), (college || '').trim(), bcrypt.hashSync(password, 10)).lastInsertRowid;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  res.json({ token: sign(u), user: pub(u) });
});

app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
  if (!u || !bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Email or password is wrong.' });
  res.json({ token: sign(u), user: pub(u) });
});

app.get('/api/me', auth(true), (req, res) => res.json(pub(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id))));

app.get('/api/events', auth(false), (req, res) => {
  const uid = req.user ? req.user.id : -1;
  res.json(db.prepare(`SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id) registered,
    EXISTS(SELECT 1 FROM registrations r WHERE r.event_id=e.id AND r.user_id=?) mine FROM events e ORDER BY date`).all(uid));
});

app.post('/api/events/:id/register', auth(true), (req, res) => {
  const e = db.prepare('SELECT *, (SELECT COUNT(*) FROM registrations WHERE event_id=events.id) n FROM events WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Event not found.' });
  if (e.n >= e.capacity) return res.status(409).json({ error: 'This event is full.' });
  db.prepare('INSERT OR IGNORE INTO registrations(user_id,event_id) VALUES(?,?)').run(req.user.id, e.id);
  res.json({ ok: true });
});

app.delete('/api/events/:id/register', auth(true), (req, res) => {
  db.prepare('DELETE FROM registrations WHERE user_id=? AND event_id=?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});

app.listen(4000, () => console.log('DevNov API on http://localhost:4000'));
