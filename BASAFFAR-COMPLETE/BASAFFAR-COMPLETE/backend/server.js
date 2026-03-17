const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const fs           = require('fs');
const path         = require('path');
const { router: authRouter } = require('./auth');
const { requireAuth, requireRole, requireAdminDashboard, IS_PROD } = require('./authMiddleware');
const { setupReplitAuth } = require('./replitAuth');

const app  = express();
const PORT = 3000;
const DB   = path.join(__dirname, 'db.json');

// ─── Environment validation ───────────────────────────────────────────────────
if (IS_PROD) {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'APP_URL'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('[FATAL] Missing required env vars in production:', missing.join(', '));
    process.exit(1);
  }
}
if (!process.env.JWT_SECRET)         console.warn('[WARN] JWT_SECRET not set — using random dev secret (NOT safe for production)');
if (!process.env.JWT_REFRESH_SECRET) console.warn('[WARN] JWT_REFRESH_SECRET not set — using random dev secret');
if (!process.env.APP_URL)            console.warn('[WARN] APP_URL not set — email links will point to localhost:3000');

// ─── CORS — credentials + specific origins ───────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5000',
  'http://localhost:3000',
  ...(IS_PROD ? [process.env.APP_URL, process.env.ADMIN_URL] : []),
  ...(process.env.REPLIT_DOMAINS ? [`https://${process.env.REPLIT_DOMAINS}`] : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=()');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.path}`);
  next();
});

// ─── Auth routes (public — login, register, refresh, etc.) ───────────────────
app.use('/api/auth', authRouter);

// ─── Admin login page (serves standalone login for the dashboard) ─────────────
app.get('/admin-login', (req, res) => {
  res.send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>دخول الإدارة</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#0A1628;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#0F2347;border-radius:20px;padding:36px 28px;max-width:380px;width:100%;border:1px solid rgba(36,99,235,0.25)}h2{color:white;text-align:center;margin-bottom:6px;font-size:18px}.sub{color:rgba(255,255,255,0.4);font-size:12px;text-align:center;margin-bottom:28px}label{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);margin-bottom:5px;text-align:right}input{width:100%;padding:12px;border:1px solid rgba(36,99,235,0.3);border-radius:12px;font-size:14px;color:white;background:rgba(36,99,235,0.08);margin-bottom:14px;outline:none}button{width:100%;padding:14px;background:#2463EB;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer}.msg{text-align:center;margin-top:14px;font-size:12px;color:#FF8080}</style></head><body><div class="card"><h2>🔒 دخول لوحة التحكم</h2><p class="sub">DR BASAFFAR Admin Dashboard</p><form id="f"><label>البريد الإلكتروني</label><input type="email" id="em" required placeholder="admin@basaffar.com"/><label>كلمة المرور</label><input type="password" id="pw" required/><button type="submit">دخول</button></form><p class="msg" id="msg"></p></div><script>document.getElementById('f').addEventListener('submit',async(e)=>{e.preventDefault();const msg=document.getElementById('msg');msg.textContent='';const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email:document.getElementById('em').value,password:document.getElementById('pw').value,captchaId:'',captchaAnswer:''})});const d=await r.json();if(d.ok){if(['admin','super_admin'].includes(d.user?.role)){window.location.href='/';}else{msg.textContent='ليس لديك صلاحية الوصول للوحة التحكم';}}else{msg.textContent=d.msg||'خطأ في البيانات';}});</script></body></html>`);
});

// ─── Serve dashboard static assets (CSS, JS, images — no auth needed) ─────────
app.use(express.static(path.join(__dirname, '../dashboard'), { index: false }));

// ─── Dashboard HTML — protected (admin/super_admin only) ─────────────────────
app.get('/', requireAdminDashboard, (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/alshakreen-dashboard.html'));
});

// ─── DB helpers ────────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB)) writeDB(defaultDB());
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}
function defaultDB() {
  return {
    depts: [
      { id:1, label:'الأسنان',         labelEn:'Dental',        dept:'أسنان',    image:'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80', color:['#0A1628','#1A3A6B'], active:true,  order:1 },
      { id:2, label:'الجلدية والليزر', labelEn:'Dermatology',   dept:'جلدية',    image:'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=80', color:['#0D2154','#1A4A8A'], active:true,  order:2 },
      { id:3, label:'العيون',          labelEn:'Ophthalmology', dept:'عيون',     image:'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=300&q=80', color:['#0A1840','#102060'], active:true,  order:3 },
      { id:4, label:'التجميل',         labelEn:'Cosmetics',     dept:'تجميل',   image:'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=300&q=80', color:['#0D1840','#1A2870'], active:true,  order:4 },
      { id:5, label:'فروعنا',          labelEn:'Branches',      dept:'branches', image:'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&q=80', color:['#0A1530','#1A3070'], active:true,  order:5 },
    ],
    offers: [
      { id:1, dept:'أسنان', icon:'🦷', name:'زراعة الأسنان + تركيبة الزيركون',  nameEn:'Implant + Zirconia', price:2590, orig:3200, color:['#0A1628','#1A3A6B'], desc:'زراعة الأسنان بالتقنية الحديثة مع تركيبة الزيركون عالية الجودة.', active:true },
      { id:2, dept:'جلدية',icon:'✨', name:'جلسة ليزر إزالة الشعر الكامل',      nameEn:'Full Laser Hair Removal', price:890,  orig:1200, color:['#0D2154','#1A4A8A'], desc:'إزالة شعر بالليزر الأمريكي لجميع مناطق الجسم.', active:true },
      { id:3, dept:'عيون', icon:'👁️', name:'تصحيح النظر بالليزر LASIK',         nameEn:'LASIK Eye Surgery', price:3200, orig:3200, color:['#0A1840','#102060'], desc:'عملية تصحيح النظر بتقنية الليزر الجديدة الآمنة.', active:true },
      { id:4, dept:'أسنان',icon:'🦷', name:'زراعة الأسنان + تركيبة البورسلين', nameEn:'Implant + Porcelain', price:2390, orig:2800, color:['#0A1628','#0F2A5A'], desc:'زراعة مع تركيبة البورسلين ذات المظهر الطبيعي.', active:true },
      { id:5, dept:'تجميل',icon:'💄', name:'حقن البوتوكس للوجه',               nameEn:'Face Botox', price:1200, orig:1500, color:['#0D1840','#1A2870'], desc:'حقن البوتوكس لإزالة التجاعيد وتحسين مظهر الوجه.', active:true },
      { id:6, dept:'أسنان',icon:'🦷', name:'تبييض الأسنان بالليزر',            nameEn:'Laser Teeth Whitening', price:650,  orig:900,  color:['#0A1838','#1030A0'], desc:'جلسة تبييض بالليزر لنتائج فورية.', active:true },
      { id:7, dept:'جلدية',icon:'✨', name:'جلسة تقشير البشرة الكيميائي',      nameEn:'Chemical Peel', price:480,  orig:600,  color:['#061830','#0E2860'], desc:'تقشير كيميائي متخصص لتجديد البشرة.', active:true },
      { id:8, dept:'تجميل',icon:'💄', name:'فيلر الشفاه والخدود',              nameEn:'Lip & Cheek Filler', price:980,  orig:1200, color:['#0A1530','#1A3070'], desc:'حقن الفيلر لتحسين حجم وشكل الشفاه.', active:true },
    ],
    doctors: [
      { id:1, name:'د. أحمد باصفار',  nameEn:'Dr. Ahmed Basaffar',  spec:'أسنان وزراعة', specEn:'Dental & Implants', exp:15, rating:4.9, patients:2400, emoji:'👨‍⚕️', color:['#0A1628','#1A3A6B'], bio:'متخصص في زراعة الأسنان وتركيبات الزيركون، حاصل على زمالة من المجلس السعودي للتخصصات الصحية.', branches:['الرياض','جدة'], active:true },
      { id:2, name:'د. سارة النجدي',  nameEn:'Dr. Sara Al-Najdi',   spec:'جلدية وليزر',  specEn:'Dermatology & Laser', exp:10, rating:4.8, patients:1800, emoji:'👩‍⚕️', color:['#0D2154','#1A4A8A'], bio:'متخصصة في الجلدية وعلاجات الليزر، عضو الجمعية السعودية للجلدية.', branches:['جدة'], active:true },
      { id:3, name:'د. خالد العمري',  nameEn:'Dr. Khalid Al-Omari', spec:'عيون وليزر',   specEn:'Ophthalmology', exp:12, rating:4.9, patients:2100, emoji:'👨‍⚕️', color:['#0A1840','#102060'], bio:'استشاري عيون متخصص في تصحيح النظر بالليزر.', branches:['الرياض','الدمام'], active:true },
      { id:4, name:'د. ريم الزهراني',nameEn:'Dr. Reem Al-Zahrani', spec:'تجميل وحقن',   specEn:'Cosmetics & Injections', exp:8, rating:4.7, patients:1200, emoji:'👩‍⚕️', color:['#0D1840','#1A2870'], bio:'متخصصة في التجميل الطبي وحقن البوتوكس والفيلر.', branches:['جدة'], active:true },
    ],
    banners: [
      { id:1, title:'DR BASAFFAR',    subtitle:'رعاية طبية متخصصة بأحدث التقنيات', tag:'مركز باصفار 🏥',    color:['#0A1628','#1A3A6B'], active:true, order:1 },
      { id:2, title:'زراعة الأسنان', subtitle:'أحدث تقنيات الزراعة الفورية',        tag:'قسم الأسنان 🦷',   color:['#0D2154','#1A4A8A'], active:true, order:2 },
      { id:3, title:'جلسات الليزر',  subtitle:'تقنية الليزر بالأجهزة الأمريكية',    tag:'الجلدية والليزر ✨',color:['#0A1840','#102060'], active:true, order:3 },
    ],
    branches: [
      { id:1, name:'الرياض — حي النزهة', nameEn:'Riyadh - Al-Nuzha', city:'الرياض', addr:'طريق الملك عبدالله، حي النزهة', phone:'011-234-5678', hours:'8 ص – 10 م', open:true,  depts:['أسنان','جلدية','عيون'], active:true },
      { id:2, name:'جدة — حي الروضة',    nameEn:'Jeddah - Al-Rawdah', city:'جدة',   addr:'شارع التحلية، حي الروضة',        phone:'012-345-6789', hours:'9 ص – 11 م', open:true,  depts:['أسنان','تجميل'],         active:true },
      { id:3, name:'الدمام — العزيزية',  nameEn:'Dammam - Al-Aziziya', city:'الدمام',addr:'طريق الأمير محمد بن فهد',        phone:'013-456-7890', hours:'9 ص – 10 م', open:false, depts:['أسنان','جلدية'],          active:true },
    ],
    bookings: [], clients: [], notifications: [], sessions: [], auditLog: [],
    settings: {
      appNameAr: 'باصفار', appNameEn: 'DR BASAFFAR',
      tagline: 'مركز د. حسالم باصفار الطبي المتخصص',
      primaryColor: '#2463EB', phone: '+966501234567', email: 'info@basaffar.com',
      website: 'www.basaffar.com', enableBooking: true, enableCart: true, enableNotifications: true,
    },
    nextId: { depts:6, offers:9, doctors:5, banners:4, branches:4, bookings:1, clients:1, notifications:1 },
  };
}

function nextId(db, key) {
  const id = db.nextId[key]; db.nextId[key] = id + 1; return id;
}

// ─── STATS ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, (req, res) => {
  const db = readDB();
  res.json({
    bookingsToday:   db.bookings.filter(b => b.date === new Date().toISOString().slice(0, 10)).length,
    bookingsTotal:   db.bookings.length,
    clientsTotal:    Math.max(db.clients.length, (db.users||[]).filter(u=>u.role==='user').length),
    offersActive:    db.offers.filter(o => o.active).length,
    pendingBookings: db.bookings.filter(b => b.status === 'pending').length,
  });
});

// ─── DEPTS (public read, auth write) ─────────────────────────────────────────
app.get('/api/depts', (req, res) => {
  const db = readDB(); res.json(db.depts.sort((a, b) => a.order - b.order));
});
app.post('/api/depts', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const dept = { ...req.body, id: nextId(db, 'depts'), createdAt: new Date().toISOString() };
  db.depts.push(dept); writeDB(db); res.json({ ok: true, dept });
});
app.put('/api/depts/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.depts.findIndex(d => d.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false, msg: 'not found' });
  db.depts[idx] = { ...db.depts[idx], ...req.body }; writeDB(db); res.json({ ok: true, dept: db.depts[idx] });
});
app.delete('/api/depts/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.depts = db.depts.filter(d => d.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── OFFERS (public read, auth write) ─────────────────────────────────────────
app.get('/api/offers', (req, res) => {
  const db = readDB(); const { dept } = req.query;
  let list = db.offers; if (dept && dept !== 'all') list = list.filter(o => o.dept === dept);
  res.json(list);
});
app.post('/api/offers', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const offer = { ...req.body, id: nextId(db, 'offers'), createdAt: new Date().toISOString() };
  db.offers.push(offer); writeDB(db); res.json({ ok: true, offer });
});
app.put('/api/offers/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.offers.findIndex(o => o.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false });
  db.offers[idx] = { ...db.offers[idx], ...req.body }; writeDB(db); res.json({ ok: true, offer: db.offers[idx] });
});
app.delete('/api/offers/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.offers = db.offers.filter(o => o.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── DOCTORS (public read, auth write) ─────────────────────────────────────────
app.get('/api/doctors', (req, res) => {
  const db = readDB(); res.json(db.doctors.filter(d => d.active !== false));
});
app.post('/api/doctors', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const doc = { ...req.body, id: nextId(db, 'doctors'), createdAt: new Date().toISOString() };
  db.doctors.push(doc); writeDB(db); res.json({ ok: true, doctor: doc });
});
app.put('/api/doctors/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.doctors.findIndex(d => d.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false });
  db.doctors[idx] = { ...db.doctors[idx], ...req.body }; writeDB(db); res.json({ ok: true, doctor: db.doctors[idx] });
});
app.delete('/api/doctors/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.doctors = db.doctors.filter(d => d.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── BANNERS (public read, auth write) ─────────────────────────────────────────
app.get('/api/banners', (req, res) => {
  const db = readDB(); res.json(db.banners.filter(b => b.active).sort((a, b) => a.order - b.order));
});
app.post('/api/banners', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const banner = { ...req.body, id: nextId(db, 'banners'), createdAt: new Date().toISOString() };
  db.banners.push(banner); writeDB(db); res.json({ ok: true, banner });
});
app.put('/api/banners/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.banners.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false });
  db.banners[idx] = { ...db.banners[idx], ...req.body }; writeDB(db); res.json({ ok: true, banner: db.banners[idx] });
});
app.delete('/api/banners/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.banners = db.banners.filter(b => b.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── BRANCHES (public read, auth write) ─────────────────────────────────────────
app.get('/api/branches', (req, res) => {
  const db = readDB(); res.json(db.branches.filter(b => b.active));
});
app.post('/api/branches', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const branch = { ...req.body, id: nextId(db, 'branches'), createdAt: new Date().toISOString() };
  db.branches.push(branch); writeDB(db); res.json({ ok: true, branch });
});
app.put('/api/branches/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.branches.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false });
  db.branches[idx] = { ...db.branches[idx], ...req.body }; writeDB(db); res.json({ ok: true, branch: db.branches[idx] });
});
app.delete('/api/branches/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.branches = db.branches.filter(b => b.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── BOOKINGS ──────────────────────────────────────────────────────────────────
app.get('/api/bookings', requireAuth, (req, res) => {
  const db = readDB(); const { status } = req.query;
  let list = [...db.bookings].reverse();
  if (status) list = list.filter(b => b.status === status);
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    list = list.filter(b => b.userId === req.user.id);
  }
  res.json(list);
});
app.post('/api/bookings', requireAuth, (req, res) => {
  const db = readDB(); const id = nextId(db, 'bookings');
  const code = 'BK-' + String(3000 + id).padStart(4, '0');
  const booking = { ...req.body, id, code, status: 'pending', userId: req.user.id, date: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
  db.bookings.push(booking);
  const ex = db.clients.find(c => c.id === req.user.id);
  if (ex) {
    ex.bookings = (ex.bookings || 0) + 1;
  } else {
    const dbUser = db.users.find(u => u.id === req.user.id);
    db.clients.push({ id: req.user.id, name: req.body.name || (dbUser && dbUser.name) || '', email: (dbUser && dbUser.email) || null, phone: req.body.phone || (dbUser && dbUser.phone) || '', idNum: req.body.idNum || (dbUser && dbUser.idNum) || null, bookings: 1, joinedAt: (dbUser && dbUser.createdAt) || new Date().toISOString() });
  }
  writeDB(db); res.json({ ok: true, booking });
});
app.put('/api/bookings/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); const idx = db.bookings.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok: false });
  db.bookings[idx] = { ...db.bookings[idx], ...req.body }; writeDB(db); res.json({ ok: true, booking: db.bookings[idx] });
});
app.delete('/api/bookings/:id', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.bookings = db.bookings.filter(b => b.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ─── CLIENTS (admin only) ──────────────────────────────────────────────────────
app.get('/api/clients', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB();
  const users   = (db.users   || []).filter(u => u.role === 'user');
  const clients = (db.clients || []);

  // Build a lookup of db.clients by id for fast access
  const clientById = {};
  clients.forEach(c => { clientById[c.id] = c; });

  // Build set of user IDs to distinguish auth users from booking-only clients
  const userIds = new Set(users.map(u => u.id));

  // 1. Auth users — db.users is authoritative; merge bookings count from db.clients
  const result = users.map(u => {
    const c = clientById[u.id] || {};
    return {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      phone:       u.phone,
      idNum:       u.idNum       || c.idNum       || null,
      age:         u.age         || c.age         || null,
      nationality: u.nationality || c.nationality || null,
      bookings:    c.bookings    || u.bookings    || 0,
      joinedAt:    u.createdAt,
    };
  });

  // 2. Booking-form-only clients (no matching user account) — keep as-is
  clients.forEach(c => {
    if (!userIds.has(c.id)) result.push({ ...c });
  });

  result.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  res.json(result);
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/notifications', requireAuth, (req, res) => {
  const db = readDB(); res.json([...db.notifications].reverse());
});
app.post('/api/notifications', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB();
  const notif = { ...req.body, id: nextId(db, 'notifications'), sentAt: new Date().toISOString(), reach: db.clients.length || 1284 };
  db.notifications.push(notif); writeDB(db); res.json({ ok: true, notification: notif });
});

// ─── SETTINGS ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const db = readDB(); res.json(db.settings);
});
app.put('/api/settings', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db = readDB(); db.settings = { ...db.settings, ...req.body };
  writeDB(db); res.json({ ok: true, settings: db.settings });
});

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ─── START ──────────────────────────────────────────────────────────────────────
async function startServer() {
  // Set up Replit Auth (registers /api/replit-login, /api/replit-callback, etc.)
  try {
    await setupReplitAuth(app);
  } catch (err) {
    console.warn('[ReplitAuth] Could not initialize (missing REPL_ID?):', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    readDB();
    console.log('\n╔══════════════════════════════════════╗');
    console.log(`║  DR BASAFFAR API  →  port ${PORT}       ║`);
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Dashboard: localhost:3000 (admin)   ║');
    console.log(`║  App API:   http://YOUR_IP:${PORT}/api  ║`);
    console.log(`║  Mode: ${IS_PROD ? 'PRODUCTION' : 'development'}                  ║`);
    console.log('╚══════════════════════════════════════╝\n');
  });
}

startServer();
