import { useEffect, useState } from "react";
import { useGetChildDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Star, Award, Calendar, Flame, Trophy, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import { Confetti } from "@/components/confetti";
import { achievementsApi, type ChildAchievementsResp } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function ChildDashboard() {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const { play, speak } = useSounds();
  const [confetti, setConfetti] = useState(false);
  const [ach, setAch] = useState<ChildAchievementsResp | null>(null);

  const { data: dashboard, isLoading } = useGetChildDashboard(user?.childId || 0, {
    query: { enabled: !!user?.childId },
  });

  useEffect(() => {
    if (user?.childId) achievementsApi.childAchievements(user.childId).then(setAch).catch(() => {});
  }, [user?.childId]);

  // Welcome sound + confetti on mount
  useEffect(() => {
    if (!dashboard) return;
    const t1 = setTimeout(() => { play("achievement"); setConfetti(true); }, 300);
    const t2 = setTimeout(() => speak(lang === "ar" ? `أهلاً ${dashboard.childName}` : `Hello ${dashboard.childName}`, lang === "ar" ? "ar-SA" : "en-US"), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [dashboard?.childName]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-64 w-[80%] rounded-3xl" />
      </div>
    );
  }
  if (!dashboard) return <div className="text-center py-12">{t("common.noData")}</div>;

  const greet = lang === "ar" ? "أهلاً يا بطل! 🚀" : "Hi champion! 🚀";

  return (
    <div className="relative">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Hero / mascot greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 md:p-8 mb-6 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-10 -end-10 w-48 h-48 bg-yellow-300/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -start-10 w-56 h-56 bg-pink-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-5">
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl md:text-7xl select-none cursor-pointer"
            onClick={() => { play("pop"); speak(dashboard.childName, lang === "ar" ? "ar-SA" : "en-US"); }}
          >
            🦁
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-black drop-shadow-md">{greet}</h1>
            <p className="text-lg md:text-2xl font-bold text-yellow-200 mt-1">{dashboard.childName}</p>
          </div>
          <Sparkles className="hidden md:block w-12 h-12 text-yellow-300 animate-glow" />
          <Button
            onClick={() => { play("swoosh"); logout(); }}
            className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-full font-bold backdrop-blur"
            size="sm"
          >
            <LogOut className="w-4 h-4 me-1" />
            {t("logout")}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatBubble color="from-yellow-300 to-amber-400" icon={<Star className="w-8 h-8 fill-current" />} value={dashboard.stars} label={lang === "ar" ? "النجوم" : "Stars"} delay={0} onClick={() => play("pop")} />
        <StatBubble color="from-purple-400 to-pink-500" icon={<Award className="w-8 h-8" />} value={dashboard.level} label={lang === "ar" ? "المستوى" : "Level"} delay={0.1} onClick={() => play("success")} />
        <StatBubble color="from-orange-400 to-red-500" icon={<Flame className="w-8 h-8 fill-current" />} value={`${dashboard.streakDays}🔥`} label={lang === "ar" ? "حماسك" : "Streak"} delay={0.2} onClick={() => play("pop")} />
        <StatBubble color="from-emerald-400 to-teal-500" icon={<Trophy className="w-8 h-8" />} value={ach?.totalEarned ?? 0} label={lang === "ar" ? "إنجازات" : "Trophies"} delay={0.3} onClick={() => play("achievement")} />
      </div>

      {/* Today's exercises */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-3xl shadow-lg border-2 border-primary/10 p-6 md:p-8 mb-6"
      >
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            🎯 {lang === "ar" ? "تمارين اليوم" : "Today's Exercises"}
          </h2>
          <Link
            href="/child/exercises"
            onClick={() => play("click")}
            className="px-6 py-3 gradient-primary text-white rounded-full font-bold text-lg shadow-md hover:scale-105 transition-transform"
          >
            {lang === "ar" ? "ابدأ اللعب! 🎮" : "Let's play! 🎮"}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dashboard.todayExercises.map((ex: any, idx: number) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, rotate: 1 }}
              onClick={() => play("pop")}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 p-5 rounded-3xl flex items-center gap-4 cursor-pointer"
            >
              <div className="text-5xl">{ex.emoji || "🎮"}</div>
              <div>
                <h3 className="text-xl font-bold">{ex.title}</h3>
                <p className="text-muted-foreground text-sm">{ex.description}</p>
              </div>
            </motion.div>
          ))}
          {dashboard.todayExercises.length === 0 && (
            <div className="md:col-span-2 text-center py-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl">
              <div className="text-6xl mb-3 animate-float">🎉</div>
              <h3 className="text-xl font-bold">{lang === "ar" ? "أنهيت كل التمارين! أنت بطل!" : "All done! You're a champion!"}</h3>
            </div>
          )}
        </div>
      </motion.div>

      {/* Latest achievements */}
      {ach && ach.earned.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-3xl shadow-lg border-2 border-secondary/20 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black flex items-center gap-2">🏆 {lang === "ar" ? "آخر إنجازاتك" : "Latest Achievements"}</h2>
            <Link href="/child/achievements" onClick={() => play("click")} className="text-sm font-semibold text-primary hover:underline">{t("common.viewAll")} →</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ach.earned.slice(0, 6).map(a => (
              <motion.div key={a.id} whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => play("achievement")}
                className="text-center p-3 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/40 dark:to-amber-900/40 rounded-2xl cursor-pointer">
                <div className="text-4xl animate-float">{a.emoji}</div>
                <p className="text-xs font-bold mt-1 truncate">{lang === "ar" ? a.title : a.titleEn}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Next appointment */}
      {dashboard.nextAppointment && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white p-6 rounded-3xl shadow-lg flex items-center gap-4">
          <Calendar className="w-12 h-12" />
          <div>
            <p className="font-bold text-lg">{lang === "ar" ? "موعدك القادم" : "Next appointment"}</p>
            <p className="text-2xl font-black">{formatDate(dashboard.nextAppointment, lang)}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBubble({ color, icon, value, label, delay, onClick }: { color: string; icon: React.ReactNode; value: any; label: string; delay: number; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} text-white p-4 md:p-5 rounded-3xl shadow-md text-center w-full`}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl md:text-3xl font-black drop-shadow">{value}</p>
      <p className="text-xs md:text-sm font-bold opacity-95 mt-1">{label}</p>
    </motion.button>
  );
}
