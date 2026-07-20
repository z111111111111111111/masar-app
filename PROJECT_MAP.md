# خريطة مشروع مسار — PROJECT_MAP.md

> آخر تحديث: 2026-07-19

## نظرة عامة

**مسار** — منصة تعليمية تفاعلية بالذكاء الاصطناعي لتحضير البكالوريا.
Frontend SPA مبني بـ React + Vite + TypeScript + Tailwind + shadcn/ui.

---

## هيكل الملفات

```
src/
├── main.tsx                      # نقطة الدخول (ConvexBetterAuthProvider)
├── App.tsx                       # التوجيه الرئيسي + حارس المصادقة (Convex queries)
├── index.css                     # Tailwind + design tokens
│
├── lib/
│   ├── utils.ts                  # cn() utility
│   ├── auth-client.ts            # Better Auth client (signIn, signUp, signOut, useSession)
│   ├── mockPayment.ts            # محرّك الدفع الوهمي (التحقق من البطاقة فقط)
│   ├── useDarkMode.ts            # Dark mode toggle
│   ├── dates.ts                  # تواريخ، XP، streaks، leagues، RecordsMap
│   ├── subjects.ts               # تعريفات المواد الخمس
│   └── curriculum.ts             # المنهج الأسبوعي
│
├── data/
│   └── exerciseBank.ts           # بنك التمارين (سيُ迁移 إلى Convex)
│
├── hooks/
│   └── use-toast.ts              # Toast notifications
│
├── components/
│   ├── AuthScreen.tsx            # تسجيل دخول / إنشاء حساب (Better Auth)
│   ├── PaymentScreen.tsx         # بوابة الدفع التجريبية (Convex mutation)
│   ├── AppShell.tsx              # الهيكل + القوائم + الشريط السفلي
│   ├── DashboardTab.tsx          # الصفحة الرئيسية (Convex mutations)
│   ├── PathTab.tsx               # المتابعة اليومية (Convex mutations)
│   ├── RoadmapTab.tsx            # خارطة المسار
│   ├── LeaderboardTab.tsx        # المتصدرون (Convex query)
│   ├── ProfileTab.tsx            # حسابي (+ زر مشاركة الحساب)
│   ├── ShareProfileSheet.tsx     # نافذة الحساب الشخصي (للقراءة فقط — مشاركة)
│   ├── TodayTimerCard.tsx        # مؤقّت التمرين
│   ├── RandomExerciseCard.tsx    # التمرين العشوائي
│   ├── CountdownCard.tsx         # العد التنازلي
│   ├── ExamCountdownCard.tsx     # العد التنازلي للامتحان
│   ├── ScoreDialog.tsx           # إدخال العلامة
│   ├── CorrectorChatSheet.tsx    # المصحح الذكي
│   ├── MonthChart.tsx            # رسم بياني شهري
│   ├── SubjectPerformanceCharts.tsx # رسوم الأداء حسم المادة
│   ├── SubjectIcon.tsx           # أيقونات المواد
│   ├── icons.tsx                 # مكتبة SVG icons (+ ShareIcon)
│   └── ui/                       # مكونات shadcn/ui

convex/                            # ← NEW: Convex backend
├── convex.config.ts              # تسجيل Better Auth component
├── auth.config.ts                # مزوّد المصادقة
├── schema.ts                     # مخطط قاعدة البيانات
├── auth.ts                       # Better Auth instance + getCurrentUser
├── http.ts                       # مسارات HTTP (auth routes)
├── subscription.ts               # استعلامات/طفرات الاشتراك
├── progress.ts                   # استعلامات/طفرات التقدّم
├── leaderboard.ts                # استعلام لوحة المتصدرين
└── exercises.ts                  # استعلامات بنك التمارين

convex/_generated/                 # ← AUTO-GENERATED (npx convex dev)
├── api.ts                        # Typed API references
├── dataModel.ts                  # DataModel type
└── server.ts                     # Server utilities
```

---

## تدفّق المصادقة (الجديد — Better Auth + Convex)

```
المستخدم يفتح التطبيق
    ↓
[useSession] من Better Auth يتحقق من الجلسة
    ↓
── غير مسجّل → AuthScreen (تسجيل/دخول عبر Better Auth)
    ↓ (تسجيل جديد)
── [subscription.get] يتحقق من الاشتراك
    ↓
── لم يدفع → PaymentScreen ($15/فصل)
    ↓ (دفع ناجح)
── [subscription.activate] mutation ينشئ سجل اشتراك في Convex
    ↓
── [progress.create] mutation ينشئ بروفايل من اسم المستخدم
    ↓
── AppShell (التطبيق الرئيسي)
```

---

## قاعدة البيانات (Convex)

### جداول Better Auth (تلقائية)
| الجدول          | المفتاح          | الحقول                    |
|----------------|-----------------|--------------------------|
| `user`         | `id`            | name, email, image, ...  |
| `session`      | `id`            | userId, token, expiresAt |
| `account`      | `id`            | userId, provider, ...    |
| `verification` | `id`            | ...                      |

### جداول مخصصة
| الجدول            | المفتاح        | الحقول                                           |
|------------------|----------------|--------------------------------------------------|
| `subscriptions`  | `userId`       | plan, status, amount, paidAt, expiresAt          |
| `userProgress`   | `userId`       | name, email, startDate, currentWeek, totalScore, totalXP, streak, bestStreak, totalTimeSeconds |
| `dailyRecords`   | `userId + dateISO` | subject, score, timeSeconds, timerStatus, runningSince, viaRandom |
| `exerciseBank`   | `subject + weekNumber` | difficulty, title, statement, correction, estimatedMinutes |

---

## بوابة الدفع التجريبية

| المواصفة          | القيمة                              |
|-------------------|--------------------------------------|
| السعر             | $15.00 USD                          |
| المدة             | الفصل الدراسي الكامل (9 أشهر)       |
| بطاقة مقبولة     | أي 16 رقم صالح التنسيق              |
| بطاقة مرفوضة     | تنتهي بـ `0000`                     |
| مدة المعالجة      | ~2 ثانية (محاكاة)                   |
| في الإنتاج        | تُستبدل بـ Stripe / Chargily        |

---

## Design Tokens المستخدمة

| Token         | الدور                    |
|---------------|--------------------------|
| `--ink`       | نص أساسي                |
| `--ink-solid` | أزرار وخلفيات ثابتة     |
| `--sprout`    | نجاح / تقدّم            |
| `--ember`     | streak / تحذير دافئ     |
| `--coral`     | خطأ / رفض               |
| `--paper`     | خلفية بطاقات            |
| `--paper-warm`| خلفية الصفحة            |

---

## متطلبات التشغيل

1. `npx convex dev` — يجب تشغيله يدوياً لإنشاء `convex/_generated/` + نشر Backend
2. `BETTER_AUTH_SECRET` — يجب تعيينه في Convex: `npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)`
3. `VITE_CLAUDE_API_KEY` — مفتاح Claude API للمصحح الذكي (اختياري حالياً)
4. `.env.local` — يجب إنشاؤه من `.env.local` (_template) مع القيم الصحيحة

---

## الملفات المُهملة (deprecated)

| الملف | السبب |
|-------|-------|
| `db.ts` | استُبدل بـ Convex + Better Auth |
| `storage.ts` | استُبدل بـ Convex |
| `useAuth.ts` | استُبدل بـ `auth-client.ts` (Better Auth) |
| `useMasarData.ts` | استُبدل بـ Convex queries/mutations |
| `OnboardingScreen.tsx` | إنشاء تلقائي للبروفايل من Better Auth |

---

## النواقص والملاحظات

- ⚠️ يجب تشغيل `npx convex dev` أولاً لإنشاء `convex/_generated/`
- ⚠️ بوابة الدفع وهمية — تُستبدل ببوابة حقيقية عند الإطلاق
- ⚠️ Claude API للمصحح الذكي — قيد الربط
- ⚠️ بنك التمارين (`exerciseBank`) لا يزال في `src/data/` — يمكن ترحيله إلى Convex

---

## التغييرات الجراحية الأخيرة

| الملف | التغيير |
|-------|---------|
| `main.tsx` | تغيير: `ConvexProvider` → `ConvexBetterAuthProvider` مع Better Auth client |
| `App.tsx` | إعادة كتابة: `useAuth` + `useMasarData` → Convex queries (`progress.get`, `subscription.get`, `progress.getRecords`) |
| `AuthScreen.tsx` | إعادة كتابة: `onLogin`/`onSignup` props → `signIn.email`/`signUp.email` من Better Auth |
| `PaymentScreen.tsx` | إعادة كتابة: `activateSubscription(db)` → `subscription.activate` Convex mutation |
| `DashboardTab.tsx` | إعادة كتابة: `onStartTimer`/`onPauseTimer`/`onResumeTimer`/`onFinishSubject` props → Convex mutations مباشرة |
| `PathTab.tsx` | إعادة كتابة: `onLog`/`onClear` props → Convex `progress.recordFinish` mutation |
| `LeaderboardTab.tsx` | إعادة كتابة: `fetchLeaderboard`/`pushMyLeaderboardScore` → Convex `leaderboard.list` query |
| `auth-client.ts` | **جديد**: Better Auth client مع `signIn`, `signUp`, `signOut`, `useSession` |
| `convex/` | **جديد**: كل ملفات Backend (schema, auth, http, functions) |

### مشاركة الحساب (Profile Share)

| الملف | التغيير |
|-------|---------|
| `ProfileTab.tsx` | إضافة: زر "مشاركة الحساب" + نافذة تأكيد (نعم/لا) + دمج ShareProfileSheet |
| `ShareProfileSheet.tsx` | **جديد**: نافذة منبثقة للقراءة فقط تعرض كل معلومات الحساب (إحصائيات + رسوم بيانية) |
| `icons.tsx` | إضافة: `ShareIcon` |
| `App.tsx` | إضافة: `<Toaster />` لدعم الإشعارات المؤقتة (toast) |
