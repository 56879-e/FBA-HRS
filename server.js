const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// كلمات المرور الافتراضية
const ADMIN_PASSWORD = 'admin123';
const USER_PASSWORD = 'user123';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
	const initial = {
		categories: [
			'داتا المركزيه',
			'داتا المحافظات',
			'داتا الاعضاء بالمحافظات',
			'داتا اخري'
		],
		projects: {}, // projectId -> { id, name, category, records: [...] }
		nextProjectId: 1,
		nextRecordId: 1
	};
	fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
}

function loadDb() {
	return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveDb(db) {
	fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// بسيط جداً: التحقق من الدور عبر body أو header x-role
app.post('/api/login', (req, res) => {
	const { role, password } = req.body || {};
	if (role === 'admin' && password === ADMIN_PASSWORD) return res.json({ ok: true, role: 'admin' });
	if (role === 'user' && password === USER_PASSWORD) return res.json({ ok: true, role: 'user' });
	return res.status(401).json({ ok: false, message: 'خطأ في اسم المستخدم أو كلمة المرور' });
});

app.get('/api/categories', (req, res) => {
	const db = loadDb();
	res.json(db.categories);
});

app.get('/api/categories/:category/projects', (req, res) => {
	const db = loadDb();
	const cat = req.params.category;
	const projects = Object.values(db.projects).filter(p => p.category === cat);
	res.json(projects);
});

app.post('/api/categories/:category/projects', (req, res) => {
	const role = req.headers['x-role'] || req.body.role;
	if (role !== 'admin') return res.status(403).json({ ok: false });
	const db = loadDb();
	const name = req.body.name || 'مشروع جديد';
	const id = db.nextProjectId++;
	const project = { id: id.toString(), name, category: req.params.category, records: [] };
	db.projects[project.id] = project;
	saveDb(db);
	res.json(project);
});

app.get('/api/projects/:projectId/records', (req, res) => {
	const db = loadDb();
	const p = db.projects[req.params.projectId];
	if (!p) return res.status(404).json({ message: 'مشروع غير موجود' });
	res.json(p.records || []);
});

app.post('/api/projects/:projectId/records', (req, res) => {
	const role = req.headers['x-role'] || req.body.role;
	if (role !== 'admin') return res.status(403).json({ ok: false });
	const db = loadDb();
	const p = db.projects[req.params.projectId];
	if (!p) return res.status(404).json({ message: 'مشروع غير موجود' });
	const r = {
		id: db.nextRecordId++,
		الاسم: req.body.الاسم || '',
		المنصب: req.body.المنصب || '',
		اللجنة: req.body.اللجنة || '',
		الرقم: req.body.الرقم || '',
		الرقم_القومي: req.body.الرقم_القومي || '',
		المحافظة: req.body.المحافظة || ''
	};
	p.records.push(r);
	saveDb(db);
	res.json(r);
});

app.put('/api/projects/:projectId/records/:id', (req, res) => {
	const role = req.headers['x-role'] || req.body.role;
	if (role !== 'admin') return res.status(403).json({ ok: false });
	const db = loadDb();
	const p = db.projects[req.params.projectId];
	if (!p) return res.status(404).json({ message: 'مشروع غير موجود' });
	const rec = p.records.find(r => r.id == req.params.id);
	if (!rec) return res.status(404).json({ message: 'سجل غير موجود' });
	['الاسم','المنصب','اللجنة','الرقم','الرقم_القومي','المحافظة'].forEach(k => {
		if (req.body[k] !== undefined) rec[k] = req.body[k];
	});
	saveDb(db);
	res.json(rec);
});

app.delete('/api/projects/:projectId/records/:id', (req, res) => {
	const role = req.headers['x-role'] || req.body.role;
	if (role !== 'admin') return res.status(403).json({ ok: false });
	const db = loadDb();
	const p = db.projects[req.params.projectId];
	if (!p) return res.status(404).json({ message: 'مشروع غير موجود' });
	const idx = p.records.findIndex(r => r.id == req.params.id);
	if (idx === -1) return res.status(404).json({ message: 'سجل غير موجود' });
	p.records.splice(idx, 1);
	saveDb(db);
	res.json({ ok: true });
});

const MAX_PORT_TRIES = 10;
function startServer(port, attemptsLeft = MAX_PORT_TRIES) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log('Server running on http://localhost:' + port);
    console.log('Accessible on 0.0.0.0:' + port);
    console.log('Use environment variable PORT to override (e.g. PORT=5000)');
    console.log('Default admin password:', ADMIN_PASSWORD, 'user password:', USER_PASSWORD);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      setTimeout(() => startServer(port + 1, attemptsLeft - 1), 300);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down.');
  process.exit(0);
});

startServer(PORT);
