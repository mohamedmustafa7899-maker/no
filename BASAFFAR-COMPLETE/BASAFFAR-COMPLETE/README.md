# 🏥 DR BASAFFAR CLINIC — المشروع الكامل

## 📁 هيكل الملفات

```
BASAFFAR-COMPLETE/
│
├── 📂 backend/
│   ├── server.js          ← السيرفر الرئيسي (API)
│   ├── package.json       ← مكتبات Node.js
│   └── README.md          ← دليل التشغيل التفصيلي
│
├── 📂 dashboard/
│   └── alshakreen-dashboard.html   ← لوحة التحكم (افتح في Chrome)
│
├── 📂 mobile-app/
│   └── alshakreen-snack.js         ← التطبيق (الصق في snack.expo.dev)
│
└── README.md   ← هذا الملف
```

---

## ⚡ تشغيل سريع

### الخطوة 1 — السيرفر
```bash
cd backend
npm install
npm start
```
تأكد من ظهور: `DR BASAFFAR API → port 3000`

### الخطوة 2 — الداشبورد
افتح `dashboard/alshakreen-dashboard.html` في Chrome

### الخطوة 3 — التطبيق
1. افتح https://snack.expo.dev
2. الصق محتوى `mobile-app/alshakreen-snack.js`
3. غيّر السطر في أعلى الملف:
   ```js
   const API_URL = 'http://192.168.1.X:3000/api'; // IP جهازك
   ```
4. اضغط **My Device** → امسح QR بـ Expo Go

---

## 📱 الشاشات

| الشاشة | الوصف |
|--------|-------|
| Splash | شاشة البداية مع لوجو متحرك |
| Home | الرئيسية — بنر + أقسام بصور + عروض + أطباء |
| Offers | كل العروض مع فلتر الأقسام |
| OfferDetail | تفاصيل العرض + سلة |
| Cart | مشترياتي |
| Booking | حجز موعد |
| More | إعدادات + لغة |
| Login / Register | تسجيل الدخول / إنشاء حساب |
| DoctorDetail | ملف الطبيب |
| Branches | الفروع |
| Profile | البيانات الشخصية |

## 🎛️ الداشبورد

| القسم | الوظيفة |
|-------|---------|
| لوحة المعلومات | إحصائيات + آخر الحجوزات |
| العروض | إضافة/تعديل/حذف/إيقاف العروض |
| الأطباء | إدارة بيانات الأطباء |
| الأقسام والصور | تغيير صور وألوان الأقسام |
| البنرات | البنر المتحرك في الرئيسية |
| الفروع | إدارة الفروع وأوقاتها |
| الحجوزات | تأكيد/إلغاء الحجوزات |
| العملاء | قاعدة بيانات العملاء |
| الإشعارات | إرسال إشعارات |
| الإعدادات | اسم التطبيق، هاتف، بريد |

---

## 🔗 API Endpoints

```
GET    /api/ping          — اختبار الاتصال
GET    /api/stats         — إحصائيات
GET    /api/depts         — الأقسام
GET    /api/offers        — العروض
GET    /api/doctors       — الأطباء
GET    /api/banners       — البنرات
GET    /api/branches      — الفروع
GET    /api/bookings      — الحجوزات
GET    /api/clients       — العملاء
GET    /api/notifications — الإشعارات
GET    /api/settings      — الإعدادات

POST   /api/offers        — إضافة عرض
POST   /api/doctors       — إضافة طبيب
POST   /api/depts         — إضافة قسم
POST   /api/bookings      — حجز جديد (من التطبيق)
POST   /api/auth/login    — تسجيل الدخول
POST   /api/auth/register — تسجيل حساب جديد

PUT    /api/offers/:id    — تعديل عرض
PUT    /api/doctors/:id   — تعديل طبيب
PUT    /api/depts/:id     — تعديل قسم
PUT    /api/bookings/:id  — تحديث حالة حجز
PUT    /api/settings      — حفظ الإعدادات

DELETE /api/offers/:id    — حذف عرض
DELETE /api/doctors/:id   — حذف طبيب
DELETE /api/depts/:id     — حذف قسم
```

---

## ⚠️ ملاحظات مهمة

1. **Authentication** = بسيط (للتطوير فقط) — لا يوجد JWT أو bcrypt
2. **Database** = ملف `db.json` — ينشأ تلقائياً عند أول تشغيل
3. **Images** = روابط URL فقط — لا يوجد رفع فعلي للصور
4. **Real-time** = لا يوجد — التطبيق يحتاج إعادة فتح لرؤية التغييرات
5. **الجوال والكمبيوتر** = يجب أن يكونا على نفس الـ WiFi

---

## 🛠️ التقنيات المستخدمة

| المكوّن | التقنية |
|---------|---------|
| Backend API | Node.js + Express |
| Database | JSON file (db.json) |
| Dashboard | HTML + CSS + Vanilla JS |
| Mobile App | React Native (Expo) |
| Navigation | React Navigation |
| Gradients | expo-linear-gradient |
