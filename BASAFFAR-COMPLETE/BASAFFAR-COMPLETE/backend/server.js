const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
const { router: authRouter } = require('./auth');

const app  = express();
const PORT = 3000;
const DB   = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── Security headers ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve dashboard static files
app.use(express.static(path.join(__dirname, '../dashboard')));

// ─── Auth routes (secure) ─────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── DB helpers ────────────────────────────────────────
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
    bookings: [],
    clients: [],
    notifications: [],
    settings: {
      appNameAr: 'باصفار',
      appNameEn: 'DR BASAFFAR',
      tagline: 'مركز د. حسالم باصفار الطبي المتخصص',
      primaryColor: '#2463EB',
      phone: '+966501234567',
      email: 'info@basaffar.com',
      website: 'www.basaffar.com',
      enableBooking: true,
      enableCart: true,
      enableNotifications: true,
    },
    nextId: { depts:6, offers:9, doctors:5, banners:4, branches:4, bookings:1, clients:1, notifications:1 },
  };
}

function nextId(db, key) {
  const id = db.nextId[key];
  db.nextId[key] = id + 1;
  return id;
}

// ─── MIDDLEWARE ─────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString().slice(11,19)} ${req.method} ${req.path}`);
  next();
});

// ─── STATS ─────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json({
    bookingsToday:  db.bookings.filter(b => b.date === new Date().toISOString().slice(0,10)).length,
    bookingsTotal:  db.bookings.length,
    clientsTotal:   db.clients.length,
    offersActive:   db.offers.filter(o => o.active).length,
    pendingBookings:db.bookings.filter(b => b.status === 'pending').length,
  });
});

// ─── DEPTS ─────────────────────────────────────────────
app.get('/api/depts', (req, res) => {
  const db = readDB();
  const list = db.depts.sort((a,b)=>a.order-b.order);
  res.json(list);
});

app.post('/api/depts', (req, res) => {
  const db = readDB();
  const dept = { ...req.body, id: nextId(db,'depts'), createdAt: new Date().toISOString() };
  db.depts.push(dept);
  writeDB(db);
  res.json({ ok:true, dept });
});

app.put('/api/depts/:id', (req, res) => {
  const db = readDB();
  const idx = db.depts.findIndex(d => d.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false, msg:'not found' });
  db.depts[idx] = { ...db.depts[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, dept: db.depts[idx] });
});

app.delete('/api/depts/:id', (req, res) => {
  const db = readDB();
  db.depts = db.depts.filter(d => d.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── OFFERS ────────────────────────────────────────────
app.get('/api/offers', (req, res) => {
  const db = readDB();
  const { dept } = req.query;
  let list = db.offers;
  if (dept && dept !== 'all') list = list.filter(o => o.dept === dept);
  res.json(list);
});

app.post('/api/offers', (req, res) => {
  const db = readDB();
  const offer = { ...req.body, id: nextId(db,'offers'), createdAt: new Date().toISOString() };
  db.offers.push(offer);
  writeDB(db);
  res.json({ ok:true, offer });
});

app.put('/api/offers/:id', (req, res) => {
  const db = readDB();
  const idx = db.offers.findIndex(o => o.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false });
  db.offers[idx] = { ...db.offers[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, offer: db.offers[idx] });
});

app.delete('/api/offers/:id', (req, res) => {
  const db = readDB();
  db.offers = db.offers.filter(o => o.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── DOCTORS ───────────────────────────────────────────
app.get('/api/doctors', (req, res) => {
  const db = readDB();
  res.json(db.doctors.filter(d => d.active !== false));
});

app.post('/api/doctors', (req, res) => {
  const db = readDB();
  const doc = { ...req.body, id: nextId(db,'doctors'), createdAt: new Date().toISOString() };
  db.doctors.push(doc);
  writeDB(db);
  res.json({ ok:true, doctor: doc });
});

app.put('/api/doctors/:id', (req, res) => {
  const db = readDB();
  const idx = db.doctors.findIndex(d => d.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false });
  db.doctors[idx] = { ...db.doctors[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, doctor: db.doctors[idx] });
});

app.delete('/api/doctors/:id', (req, res) => {
  const db = readDB();
  db.doctors = db.doctors.filter(d => d.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── BANNERS ───────────────────────────────────────────
app.get('/api/banners', (req, res) => {
  const db = readDB();
  res.json(db.banners.filter(b=>b.active).sort((a,b)=>a.order-b.order));
});

app.post('/api/banners', (req, res) => {
  const db = readDB();
  const banner = { ...req.body, id: nextId(db,'banners'), createdAt: new Date().toISOString() };
  db.banners.push(banner);
  writeDB(db);
  res.json({ ok:true, banner });
});

app.put('/api/banners/:id', (req, res) => {
  const db = readDB();
  const idx = db.banners.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false });
  db.banners[idx] = { ...db.banners[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, banner: db.banners[idx] });
});

app.delete('/api/banners/:id', (req, res) => {
  const db = readDB();
  db.banners = db.banners.filter(b => b.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── BRANCHES ──────────────────────────────────────────
app.get('/api/branches', (req, res) => {
  const db = readDB();
  res.json(db.branches.filter(b=>b.active));
});

app.post('/api/branches', (req, res) => {
  const db = readDB();
  const branch = { ...req.body, id: nextId(db,'branches'), createdAt: new Date().toISOString() };
  db.branches.push(branch);
  writeDB(db);
  res.json({ ok:true, branch });
});

app.put('/api/branches/:id', (req, res) => {
  const db = readDB();
  const idx = db.branches.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false });
  db.branches[idx] = { ...db.branches[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, branch: db.branches[idx] });
});

app.delete('/api/branches/:id', (req, res) => {
  const db = readDB();
  db.branches = db.branches.filter(b => b.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── BOOKINGS ──────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let list = [...db.bookings].reverse();
  if (status) list = list.filter(b => b.status === status);
  res.json(list);
});

app.post('/api/bookings', (req, res) => {
  const db = readDB();
  const id = nextId(db,'bookings');
  const code = 'BK-' + String(3000 + id).padStart(4,'0');
  const booking = {
    ...req.body,
    id,
    code,
    status: 'pending',
    date: new Date().toISOString().slice(0,10),
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);

  // add/update client
  if (req.body.phone) {
    const existing = db.clients.find(c => c.phone === req.body.phone);
    if (existing) {
      existing.bookings = (existing.bookings || 0) + 1;
    } else {
      db.clients.push({
        id: nextId(db,'clients'),
        name: req.body.name,
        phone: req.body.phone,
        idNum: req.body.idNum,
        bookings: 1,
        joinedAt: new Date().toISOString(),
      });
    }
  }

  writeDB(db);
  res.json({ ok:true, booking });
});

app.put('/api/bookings/:id', (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ok:false });
  db.bookings[idx] = { ...db.bookings[idx], ...req.body };
  writeDB(db);
  res.json({ ok:true, booking: db.bookings[idx] });
});

app.delete('/api/bookings/:id', (req, res) => {
  const db = readDB();
  db.bookings = db.bookings.filter(b => b.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok:true });
});

// ─── CLIENTS ───────────────────────────────────────────
app.get('/api/clients', (req, res) => {
  const db = readDB();
  res.json([...db.clients].reverse());
});

// ─── NOTIFICATIONS ─────────────────────────────────────
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  res.json([...db.notifications].reverse());
});

app.post('/api/notifications', (req, res) => {
  const db = readDB();
  const notif = {
    ...req.body,
    id: nextId(db,'notifications'),
    sentAt: new Date().toISOString(),
    reach: db.clients.length || 1284,
  };
  db.notifications.push(notif);
  writeDB(db);
  res.json({ ok:true, notification: notif });
});

// ─── SETTINGS ──────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ ok:true, settings: db.settings });
});

// ─── HEALTH CHECK ───────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok:true, time: new Date().toISOString() }));

// ─── DASHBOARD ROOT ─────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/alshakreen-dashboard.html'));
});

// ─── START ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  readDB(); // ensure db exists
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  DR BASAFFAR API  →  port ${PORT}       ║`);
  console.log('╠══════════════════════════════════════╣');
  console.log('║  Dashboard: open dashboard.html      ║');
  console.log(`║  App API:   http://YOUR_IP:${PORT}/api  ║`);
  console.log('╚══════════════════════════════════════╝\n');
});
