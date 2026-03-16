# 🏥 DR BASAFFAR — دليل التشغيل الكامل

## هيكل المشروع

```
basaffar-backend/
├── server.js          ← السيرفر (API)
├── package.json       ← مكتبات Node.js
└── db.json            ← قاعدة البيانات (تُنشأ تلقائياً)

alshakreen-dashboard.html   ← لوحة التحكم (افتح في المتصفح)
alshakreen-snack.js         ← التطبيق (الصق في Expo Snack)
```

---

## ▶️ خطوة 1 — تشغيل السيرفر

### المتطلبات
- Node.js 18+  → تحميل: https://nodejs.org

### التشغيل
```bash
cd basaffar-backend
npm install
npm start
```

**يجب أن ترى:**
```
╔══════════════════════════════════════╗
║  DR BASAFFAR API  →  port 3000       ║
╠══════════════════════════════════════╣
║  Dashboard: open dashboard.html      ║
║  App API:   http://YOUR_IP:3000/api  ║
╚══════════════════════════════════════╝
```

---

## ▶️ خطوة 2 — فتح الداشبورد

1. افتح ملف `alshakreen-dashboard.html` في المتصفح (Chrome/Edge)
2. انظر لأعلى اليمين — يجب أن ترى: **API متصل ✓** (باللون الأخضر)
3. إذا ظهر "API غير متصل" ← تأكد من تشغيل السيرفر أولاً

---

## ▶️ خطوة 3 — تشغيل التطبيق على الجوال

### الطريقة أ: Expo Snack (أسهل — بدون تثبيت)
1. افتح https://snack.expo.dev
2. احذف كل الكود
3. الصق محتوى `alshakreen-snack.js`
4. ⚠️ **مهم:** في أعلى الملف، غيّر:
   ```js
   const API_URL = 'http://localhost:3000/api';
   ```
   إلى IP جهازك:
   ```js
   const API_URL = 'http://192.168.1.X:3000/api';
   ```
5. اضغط **My Device** → امسح QR بتطبيق Expo Go

### كيف تعرف IP جهازك؟
- **Windows:** افتح cmd → اكتب `ipconfig` → ابحث عن IPv4 Address
- **Mac:**      افتح Terminal → اكتب `ifconfig | grep "inet "` 
- **مثال:**     `192.168.1.5`

### الطريقة ب: تشغيل محلي
```bash
cd alshakreen-expo
npm install
npx expo start
```
امسح QR الذي يظهر في الترمينال.

---

## 🔄 كيف يعمل الربط؟

```
┌─────────────────┐         HTTP/REST         ┌──────────────────┐
│  لوحة التحكم    │ ←──────────────────────→  │   السيرفر        │
│  (dashboard)    │       localhost:3000        │   (server.js)    │
└─────────────────┘                            └────────┬─────────┘
                                                        │
┌─────────────────┐         HTTP/REST                   │
│  التطبيق        │ ←──────────────────────────────────┘
│  (Expo)         │       192.168.X.X:3000
└─────────────────┘
```

### ما يتحكم فيه الداشبورد فوراً:
| القسم         | التأثير في التطبيق |
|---------------|-------------------|
| الأقسام       | صور وألوان وترتيب أقسام الصفحة الرئيسية |
| العروض        | إضافة/تعديل/إيقاف العروض وأسعارها |
| الأطباء       | إضافة وتعديل بيانات الأطباء |
| البنرات       | البنر المتحرك في الصفحة الرئيسية |
| الفروع        | قائمة الفروع وأوقات العمل |
| الحجوزات      | عرض وتأكيد وإلغاء الحجوزات الواردة من التطبيق |
| الإشعارات     | إرسال إشعارات (محاكاة) |
| الإعدادات     | اسم التطبيق، رقم الهاتف، البريد |

---

## 📡 جدول API Endpoints

| Method | Endpoint              | الوصف                     |
|--------|-----------------------|--------------------------|
| GET    | /api/depts            | جلب الأقسام               |
| POST   | /api/depts            | إضافة قسم                 |
| PUT    | /api/depts/:id        | تعديل قسم                 |
| DELETE | /api/depts/:id        | حذف قسم                   |
| GET    | /api/offers           | جلب العروض                |
| POST   | /api/offers           | إضافة عرض                 |
| PUT    | /api/offers/:id       | تعديل عرض                 |
| DELETE | /api/offers/:id       | حذف عرض                   |
| GET    | /api/doctors          | جلب الأطباء               |
| POST   | /api/doctors          | إضافة طبيب                |
| GET    | /api/banners          | جلب البنرات               |
| GET    | /api/branches         | جلب الفروع                |
| GET    | /api/bookings         | جلب الحجوزات              |
| POST   | /api/bookings         | حجز جديد (من التطبيق)     |
| PUT    | /api/bookings/:id     | تحديث حالة حجز            |
| GET    | /api/clients          | جلب العملاء               |
| POST   | /api/notifications    | إرسال إشعار               |
| GET    | /api/settings         | جلب الإعدادات             |
| PUT    | /api/settings         | تحديث الإعدادات           |
| POST   | /api/auth/login       | تسجيل الدخول              |
| POST   | /api/auth/register    | تسجيل حساب جديد           |
| GET    | /api/ping             | التحقق من حالة السيرفر    |
| GET    | /api/stats            | إحصائيات الداشبورد        |

---

## ⚠️ ملاحظات مهمة

1. **الجوال والكمبيوتر على نفس الشبكة** — يجب أن يكونا على نفس WiFi
2. **قاعدة البيانات** — ملف `db.json` يُنشأ تلقائياً عند أول تشغيل
3. **الجدار الناري** — إذا لم يتصل الجوال، افتح port 3000 في firewall الجهاز
4. **Fallback** — التطبيق يعمل بالبيانات المدمجة حتى لو السيرفر مغلق
5. **الإنتاج** — لنشر على الإنترنت، استبدل `localhost` بـ IP server حقيقي أو Railway/Render

---

## 🚀 نشر السيرفر على الإنترنت (اختياري)

### Railway (مجاني)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
احصل على URL مثل: `https://basaffar-api.railway.app`
ثم حدّث في التطبيق:
```js
const API_URL = 'https://basaffar-api.railway.app/api';
```

---

## 🧪 اختبار سريع

```bash
# تحقق من السيرفر
curl http://localhost:3000/api/ping

# جلب العروض
curl http://localhost:3000/api/offers

# إضافة حجز تجريبي
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"name":"محمد","phone":"0501234567","branch":"الرياض","offer":"زراعة أسنان"}'
```
