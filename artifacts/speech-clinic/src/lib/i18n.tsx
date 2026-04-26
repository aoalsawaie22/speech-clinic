import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  // Brand
  "brand.name": { ar: "عيادة النطق", en: "Speech Clinic" },
  "brand.tagline": { ar: "رعاية متخصصة لتطور النطق عند الأطفال", en: "Specialized care for children's speech development" },

  // Common
  "common.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.add": { ar: "إضافة", en: "Add" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.send": { ar: "إرسال", en: "Send" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.yes": { ar: "نعم", en: "Yes" },
  "common.no": { ar: "لا", en: "No" },
  "common.all": { ar: "الكل", en: "All" },
  "common.back": { ar: "رجوع", en: "Back" },
  "common.next": { ar: "التالي", en: "Next" },
  "common.start": { ar: "ابدأ", en: "Start" },
  "common.complete": { ar: "إكمال", en: "Complete" },
  "common.completed": { ar: "مكتمل", en: "Completed" },
  "common.markRead": { ar: "تعليم كمقروء", en: "Mark as read" },
  "common.markAllRead": { ar: "تعليم الكل كمقروء", en: "Mark all as read" },
  "common.noData": { ar: "لا توجد بيانات", en: "No data" },
  "common.minutes": { ar: "دقيقة", en: "min" },
  "common.points": { ar: "نقطة", en: "points" },
  "common.stars": { ar: "نجمة", en: "stars" },
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.actions": { ar: "إجراءات", en: "Actions" },
  "common.status": { ar: "الحالة", en: "Status" },
  "common.date": { ar: "التاريخ", en: "Date" },
  "common.time": { ar: "الوقت", en: "Time" },
  "common.duration": { ar: "المدة", en: "Duration" },
  "common.score": { ar: "الدرجة", en: "Score" },
  "common.notes": { ar: "ملاحظات", en: "Notes" },
  "common.welcome": { ar: "أهلاً", en: "Welcome" },

  // Auth / Login
  "login.title": { ar: "تسجيل الدخول للنظام", en: "Sign in to your account" },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.password": { ar: "كلمة المرور", en: "Password" },
  "login.submit": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.demo": { ar: "حسابات تجريبية:", en: "Demo accounts:" },
  "login.error": { ar: "بيانات الاعتماد غير صحيحة", en: "Invalid credentials" },
  "login.errorTitle": { ar: "خطأ في تسجيل الدخول", en: "Sign in failed" },
  "login.heroTitle": { ar: "خطوة بخطوة نحو نطق أفضل", en: "Step by step to better speech" },
  "login.heroSubtitle": { ar: "منصة متكاملة لمتابعة جلسات الأطفال وإدارة العلاج", en: "An integrated platform for tracking sessions and therapy management" },
  "logout": { ar: "تسجيل الخروج", en: "Sign out" },

  // Roles
  "role.admin": { ar: "مدير النظام", en: "Administrator" },
  "role.specialist": { ar: "أخصائي نطق", en: "Specialist" },
  "role.parent": { ar: "ولي أمر", en: "Parent" },
  "role.child": { ar: "طفل", en: "Child" },

  // Sidebar
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.specialists": { ar: "الأخصائيين", en: "Specialists" },
  "nav.children": { ar: "الأطفال", en: "Children" },
  "nav.appointments": { ar: "المواعيد", en: "Appointments" },
  "nav.users": { ar: "المستخدمين", en: "Users" },
  "nav.sessions": { ar: "الجلسات", en: "Sessions" },
  "nav.exercises": { ar: "التمارين", en: "Exercises" },
  "nav.myChildren": { ar: "أطفالي", en: "My Children" },
  "nav.sessionsHistory": { ar: "سجل الجلسات", en: "Session History" },
  "nav.messages": { ar: "الرسائل", en: "Messages" },
  "nav.notifications": { ar: "الإشعارات", en: "Notifications" },
  "nav.achievements": { ar: "الإنجازات", en: "Achievements" },
  "nav.reports": { ar: "التقارير", en: "Reports" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },

  // Dashboard
  "dash.totalChildren": { ar: "إجمالي الأطفال", en: "Total Children" },
  "dash.totalSpecialists": { ar: "الأخصائيين", en: "Specialists" },
  "dash.totalParents": { ar: "أولياء الأمور", en: "Parents" },
  "dash.totalSessions": { ar: "إجمالي الجلسات", en: "Total Sessions" },
  "dash.todayAppointments": { ar: "مواعيد اليوم", en: "Today's Appointments" },
  "dash.weekAppointments": { ar: "مواعيد الأسبوع", en: "Week Appointments" },
  "dash.avgProgress": { ar: "متوسط التقدم", en: "Average Progress" },
  "dash.recentSessions": { ar: "أحدث الجلسات", en: "Recent Sessions" },
  "dash.upcomingAppointments": { ar: "المواعيد القادمة", en: "Upcoming Appointments" },
  "dash.noSessions": { ar: "لا توجد جلسات حديثة", en: "No recent sessions" },
  "dash.noAppointments": { ar: "لا توجد مواعيد قادمة", en: "No upcoming appointments" },
  "dash.activeChildren": { ar: "الأطفال النشطين", en: "Active Children" },
  "dash.weekSessions": { ar: "جلسات الأسبوع", en: "Week Sessions" },
  "dash.monthSessions": { ar: "جلسات الشهر", en: "Month Sessions" },
  "dash.avgScore": { ar: "متوسط الدرجة", en: "Average Score" },
  "dash.session": { ar: "جلسة", en: "session" },
  "dash.sessions": { ar: "جلسات", en: "sessions" },
  "dash.lastSession": { ar: "آخر جلسة", en: "Last session" },

  // Charts
  "chart.sessionsTrend": { ar: "اتجاه الجلسات (آخر 30 يوم)", en: "Sessions Trend (Last 30 days)" },
  "chart.categories": { ar: "التمارين حسب الفئة", en: "Exercises by Category" },
  "chart.appointmentStatus": { ar: "حالة المواعيد", en: "Appointment Status" },
  "chart.topChildren": { ar: "أفضل الأطفال أداءً", en: "Top Performing Children" },

  // Categories (exercises)
  "cat.pronunciation": { ar: "النطق", en: "Pronunciation" },
  "cat.vocabulary": { ar: "المفردات", en: "Vocabulary" },
  "cat.fluency": { ar: "الطلاقة", en: "Fluency" },
  "cat.listening": { ar: "الاستماع", en: "Listening" },
  "cat.breathing": { ar: "التنفس", en: "Breathing" },
  "cat.oral_muscle": { ar: "عضلات الفم", en: "Oral Muscles" },
  "cat.rhythm": { ar: "الإيقاع", en: "Rhythm" },

  // Difficulty
  "diff.easy": { ar: "سهل", en: "Easy" },
  "diff.medium": { ar: "متوسط", en: "Medium" },
  "diff.hard": { ar: "صعب", en: "Hard" },

  // Status
  "status.scheduled": { ar: "مجدول", en: "Scheduled" },
  "status.completed": { ar: "مكتمل", en: "Completed" },
  "status.cancelled": { ar: "ملغي", en: "Cancelled" },
  "status.no_show": { ar: "لم يحضر", en: "No show" },

  // Child
  "child.welcome": { ar: "أهلاً يا بطل!", en: "Hello, champion!" },
  "child.todayChallenges": { ar: "تحديات اليوم", en: "Today's Challenges" },
  "child.myStars": { ar: "نجومي", en: "My Stars" },
  "child.myLevel": { ar: "مستواي", en: "My Level" },
  "child.streak": { ar: "أيام متواصلة", en: "Day streak" },
  "child.startNow": { ar: "ابدأ الآن", en: "Start Now" },
  "child.greatJob": { ar: "أحسنت!", en: "Great Job!" },
  "child.tryAgain": { ar: "حاول مرة أخرى", en: "Try Again" },
  "child.exerciseDone": { ar: "أكملت التمرين! 🎉", en: "Exercise complete! 🎉" },
  "child.newAchievement": { ar: "إنجاز جديد!", en: "New Achievement!" },

  // Achievements
  "ach.title": { ar: "إنجازاتي", en: "My Achievements" },
  "ach.earned": { ar: "محصلة", en: "Earned" },
  "ach.locked": { ar: "مغلقة", en: "Locked" },
  "ach.totalPoints": { ar: "إجمالي النقاط", en: "Total Points" },

  // Messages
  "msg.title": { ar: "الرسائل", en: "Messages" },
  "msg.placeholder": { ar: "اكتب رسالتك...", en: "Type your message..." },
  "msg.empty": { ar: "لا توجد رسائل بعد", en: "No messages yet" },
  "msg.selectConvo": { ar: "اختر محادثة لعرض الرسائل", en: "Select a conversation to view messages" },
  "msg.newMessage": { ar: "رسالة جديدة", en: "New Message" },

  // Settings
  "settings.title": { ar: "الإعدادات", en: "Settings" },
  "settings.language": { ar: "اللغة", en: "Language" },
  "settings.theme": { ar: "السمة", en: "Theme" },
  "settings.themeLight": { ar: "فاتح", en: "Light" },
  "settings.themeDark": { ar: "داكن", en: "Dark" },
  "settings.sound": { ar: "الأصوات", en: "Sound Effects" },
  "settings.soundOn": { ar: "مفعّل", en: "Enabled" },
  "settings.soundOff": { ar: "متوقف", en: "Disabled" },
  "settings.account": { ar: "الحساب", en: "Account" },
  "settings.appearance": { ar: "المظهر", en: "Appearance" },
  "settings.preferences": { ar: "التفضيلات", en: "Preferences" },

  // Reports
  "reports.title": { ar: "التقارير والإحصائيات", en: "Reports & Analytics" },
  "reports.export": { ar: "تصدير", en: "Export" },
  "reports.daily": { ar: "يوميا", en: "Daily" },
  "reports.weekly": { ar: "أسبوعياً", en: "Weekly" },
  "reports.monthly": { ar: "شهرياً", en: "Monthly" },

  // Notifications
  "notif.title": { ar: "الإشعارات", en: "Notifications" },
  "notif.empty": { ar: "لا توجد إشعارات", en: "No notifications" },
  "notif.unread": { ar: "غير مقروء", en: "Unread" },

  // Time
  "time.justNow": { ar: "الآن", en: "Just now" },
  "time.minutesAgo": { ar: "منذ دقائق", en: "minutes ago" },
  "time.hoursAgo": { ar: "منذ ساعات", en: "hours ago" },
  "time.daysAgo": { ar: "منذ أيام", en: "days ago" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    return (localStorage.getItem("speech_clinic_lang") as Lang) || "ar";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("speech_clinic_lang", l);
    setLangState(l);
  };

  const t = (key: string) => {
    const entry = dict[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
