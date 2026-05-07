import { useEffect, useRef, useState } from "react";
import { useGetChildDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, CheckCircle2, Volume2, Mic, Play, Square, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import { speakExercise, hasVoiceFor, pauseSpeech, resumeSpeech, stopSpeech } from "@/lib/sounds";
import { useToast } from "@/hooks/use-toast";
import { achievementsApi } from "@/lib/api";

export default function ChildExercises() {
  const { user, logout } = useAuth();
  const { lang } = useI18n();
  const { play, enabled: soundEnabled } = useSounds();
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  // الجزء الحالي الذي يُقرأ (للإشارة البصرية)
  const [activeChunkIdx, setActiveChunkIdx] = useState<number | null>(null);
  const lastChunksRef = useRef<{ chunks: string[]; lang: "ar" | "en" } | null>(null);

  const { data: dashboard, isLoading: isLoadingDashboard } = useGetChildDashboard(user?.childId || 0, {
    query: { enabled: !!user?.childId }
  });

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const DAILY_LIMIT = 3;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset when exercise changes
  useEffect(() => {
    stopSpeech();
    setSpeaking(false);
    setPaused(false);
    setActiveChunkIdx(null);
    lastChunksRef.current = null;
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setIsRecording(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingDashboard) {
    return (
      <div className="p-8 space-y-8 flex items-center justify-center min-h-screen">
        <Skeleton className="h-64 w-[80%] rounded-3xl" />
      </div>
    );
  }

  if (!dashboard || !dashboard.todayExercises)
    return <div className="p-12 text-center">{lang === "ar" ? "لا توجد بيانات" : "No data"}</div>;

  const exercises = dashboard.todayExercises.slice(0, DAILY_LIMIT);

  if (allDone || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="text-9xl animate-bounce">🏆</div>
        <h1 className="text-4xl md:text-5xl font-black text-primary">
          {lang === "ar" ? "أحسنت يا بطل!" : "Great job, champion!"}
        </h1>
        <p className="text-2xl font-bold text-muted-foreground">
          {lang === "ar" ? "✅ تم إنجاز تمارين اليوم!" : "✅ Today's exercises are done!"}
        </p>
        <p className="text-lg text-muted-foreground">
          {lang === "ar" ? "عد غداً لتمارين جديدة 🌟" : "Come back tomorrow for new exercises 🌟"}
        </p>
        <Link href="/child" className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl hover:bg-primary/90 transition-all shadow-lg">
          {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>
    );
  }

  const currentExercise: any = exercises[currentExerciseIndex];

  // استخراج أجزاء الجمل من تعليمات التمرين
  function extractChunks(instructions: string, title: string): string[] {
    const raw = instructions || title || "";

    // محاولة استخراج الجزء بعد "كرر/كرّر/repeat"
    const m = raw.match(/(?:كرر|كرّر|repeat)[:\s]*(.+)/i);
    const practice = (m && m[1]) ? m[1] : raw;

    // تقسيم بالفواصل والنقاط والسطر الجديد
    const parts = practice
      .split(/[،,.\n؟?!]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1); // تجاهل الأجزاء القصيرة جداً

    return parts.length > 0 ? parts : [practice.trim()];
  }

  const handleComplete = () => {
    play("complete");
    setShowSuccess(true);

    // حفظ تقدم التمرين
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        childId: user?.childId,
        exerciseId: currentExercise.id,
        score: 10,
        completed: true,
        date: today,
      }),
    }).catch(() => {});

    const isLastExercise = currentExerciseIndex >= exercises.length - 1;

    if (isLastExercise && user?.childId) {
      achievementsApi.check(user.childId).catch(() => {});
    }

    setTimeout(() => {
      setShowSuccess(false);
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        setAllDone(true);
      }
    }, 2000);
  };

  const playInstructions = async () => {
    if (!soundEnabled) {
      toast({
        title: lang === "ar" ? "الصوت معطّل" : "Sound is off",
        description: lang === "ar" ? "اضغط أيقونة 🔊 في الأعلى لتفعيل الصوت" : "Click the 🔊 icon at the top to enable sound",
        variant: "destructive",
      });
      return;
    }
    if (speaking) return;

    play("click");

    const lc: "ar" | "en" = lang === "ar" ? "ar" : "en";
    const ok = await hasVoiceFor(lc);
    if (!ok) {
      toast({
        title: lang === "ar" ? "لا يوجد صوت عربي مثبّت" : "No Arabic voice installed",
        description: lang === "ar"
          ? "افتح إعدادات Windows ← الوقت واللغة ← اللغة ← أضِف العربية مع حزمة الصوت، ثم أعد فتح المتصفح."
          : "Install an Arabic voice in your OS speech settings, then reopen the browser.",
        variant: "destructive",
      });
      return;
    }

    const childName = dashboard.childName || (lang === "ar" ? "صديقي" : "friend");
    const intro = lang === "ar"
      ? `أهلاً ${childName} يا بطل! استمع جيداً`
      : `Hi ${childName}! Listen carefully`;

    const chunks = extractChunks(currentExercise.instructions, currentExercise.title);
    lastChunksRef.current = { chunks, lang: lc };

    setSpeaking(true);
    setActiveChunkIdx(null);
    toast({
      title: lang === "ar" ? "🎧 استمع ثم كرّر!" : "🎧 Listen then repeat!",
      description: lang === "ar" ? "الصوت سيقرأ الجملة وينتظرك تكرر" : "The voice will read then wait for you to repeat",
    });

    try {
      // قول المقدمة أولاً
      const { speak } = await import("@/lib/sounds");
      await speak(intro, lc, lc === "ar" ? 0.8 : 0.9);

      // ثم تشغيل التمرين بالتدفق الصحيح
      await speakExercise(chunks, lc, (idx) => setActiveChunkIdx(idx));
    } finally {
      setSpeaking(false);
      setActiveChunkIdx(null);
    }
  };

  const pauseSpeaking = () => {
    pauseSpeech();
    setPaused(true);
    play("click");
  };

  const resumeSpeaking = () => {
    resumeSpeech();
    setPaused(false);
    play("click");
  };

  const stopSpeaking = () => {
    stopSpeech();
    setSpeaking(false);
    setPaused(false);
    setActiveChunkIdx(null);
    play("swoosh");
  };

  const repeatSpeaking = async () => {
    const last = lastChunksRef.current;
    if (!last || speaking) return;
    stopSpeech();
    await new Promise(r => setTimeout(r, 150));
    setPaused(false);
    setSpeaking(true);
    setActiveChunkIdx(null);
    try {
      await speakExercise(last.chunks, last.lang, (idx) => setActiveChunkIdx(idx));
    } finally {
      setSpeaking(false);
      setActiveChunkIdx(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mr.start();
      setIsRecording(true);
      play("pop");
    } catch (e) {
      alert(lang === "ar" ? "لم نتمكن من فتح المايكروفون. الرجاء السماح بالوصول." : "Could not open microphone. Please allow access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    play("click");
  };

  const playRecording = () => {
    if (!recordedUrl) return;
    play("click");
    const audio = new Audio(recordedUrl);
    audio.play().catch(() => {});
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    play("swoosh");
  };

  // الأجزاء المستخرجة من تعليمات التمرين الحالي (للعرض البصري)
  const currentChunks = extractChunks(currentExercise.instructions, currentExercise.title);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] dark:from-slate-900 dark:to-slate-800 p-6 md:p-12 font-sans relative overflow-hidden flex flex-col">

      {/* Top Bar */}
      <header className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <Link href="/child" onClick={() => play("click")} className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-slate-700 rounded-full font-bold hover:bg-white transition-colors">
          <ArrowRight className="w-5 h-5" />
          {lang === "ar" ? "رجوع" : "Back"}
        </Link>
        <div className="flex gap-2">
          {exercises.map((_: any, idx: number) => (
            <div
              key={idx}
              className={`h-3 w-10 md:w-12 rounded-full transition-all ${idx < currentExerciseIndex ? 'bg-green-400' : idx === currentExerciseIndex ? 'bg-primary' : 'bg-blue-200 dark:bg-slate-600'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-yellow-300">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            {dashboard.stars}
          </div>
          <Button
            onClick={() => { play("swoosh"); logout(); }}
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white rounded-full font-bold"
          >
            <LogOut className="w-4 h-4 me-1" />
            {lang === "ar" ? "خروج" : "Exit"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="text-9xl mb-4">🌟</div>
              <h2 className="text-5xl font-black text-primary">{lang === "ar" ? "عمل رائع!" : "Awesome!"}</h2>
              <p className="text-2xl font-bold text-muted-foreground">+10 {lang === "ar" ? "نجوم" : "stars"}</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentExercise.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-card w-full max-w-2xl rounded-[40px] shadow-2xl p-6 md:p-10 border-4 border-primary/20 text-center"
            >
              <div className="text-7xl md:text-8xl mb-6">{currentExercise.emoji || '🗣️'}</div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">{currentExercise.title}</h2>

              {/* عرض الجمل مع تمييز الجملة النشطة */}
              <div className="mb-6 space-y-2">
                {currentChunks.map((chunk, idx) => (
                  <p
                    key={idx}
                    className={`text-lg md:text-xl font-medium leading-relaxed transition-all duration-300 px-3 py-1 rounded-xl ${
                      activeChunkIdx === idx
                        ? "bg-primary/15 text-primary font-bold scale-105"
                        : "text-muted-foreground"
                    }`}
                  >
                    {chunk}
                  </p>
                ))}
              </div>

              {/* Audio controls */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl p-4 md:p-5 mb-6 border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3">
                  {lang === "ar" ? "🎧 استمع للجملة ثم كرّرها" : "🎧 Listen then repeat"}
                </p>

                {/* مؤشر التقدم أثناء الكلام */}
                {speaking && activeChunkIdx !== null && (
                  <p className="text-xs text-primary font-bold mb-3 animate-pulse">
                    {lang === "ar"
                      ? `📢 جزء ${activeChunkIdx + 1} من ${currentChunks.length}`
                      : `📢 Part ${activeChunkIdx + 1} of ${currentChunks.length}`}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                  <Button
                    onClick={playInstructions}
                    disabled={speaking}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold h-12 px-5 shadow-md disabled:opacity-60"
                  >
                    <Volume2 className="w-5 h-5 me-2" />
                    {lang === "ar" ? "استمع" : "Listen"}
                  </Button>

                  {speaking && !paused && (
                    <Button
                      onClick={pauseSpeaking}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                    >
                      ⏸ {lang === "ar" ? "إيقاف مؤقت" : "Pause"}
                    </Button>
                  )}

                  {speaking && paused && (
                    <Button
                      onClick={resumeSpeaking}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                    >
                      ▶ {lang === "ar" ? "متابعة" : "Resume"}
                    </Button>
                  )}

                  {speaking && (
                    <Button
                      onClick={stopSpeaking}
                      className="bg-slate-500 hover:bg-slate-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                    >
                      ⏹ {lang === "ar" ? "إيقاف" : "Stop"}
                    </Button>
                  )}

                  {!speaking && lastChunksRef.current && (
                    <Button
                      onClick={repeatSpeaking}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                    >
                      🔁 {lang === "ar" ? "إعادة" : "Repeat"}
                    </Button>
                  )}

                  {!isRecording && !recordedUrl && (
                    <Button
                      onClick={startRecording}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                    >
                      <Mic className="w-5 h-5 me-2" />
                      {lang === "ar" ? "سجّل صوتك" : "Record"}
                    </Button>
                  )}

                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold h-12 px-5 shadow-md animate-pulse"
                    >
                      <Square className="w-5 h-5 me-2 fill-white" />
                      {lang === "ar" ? "أوقف التسجيل" : "Stop"}
                    </Button>
                  )}

                  {recordedUrl && !isRecording && (
                    <>
                      <Button
                        onClick={playRecording}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold h-12 px-5 shadow-md"
                      >
                        <Play className="w-5 h-5 me-2 fill-white" />
                        {lang === "ar" ? "اسمع تسجيلك" : "Play yours"}
                      </Button>
                      <Button
                        onClick={resetRecording}
                        variant="outline"
                        className="rounded-full font-bold h-12 px-5"
                      >
                        <RotateCcw className="w-5 h-5 me-2" />
                        {lang === "ar" ? "أعد" : "Redo"}
                      </Button>
                    </>
                  )}
                </div>

                {isRecording && (
                  <p className="text-xs text-red-500 mt-3 font-bold animate-pulse">
                    {lang === "ar" ? "● جاري التسجيل..." : "● Recording..."}
                  </p>
                )}

                {/* تعليمات الاستخدام */}
                {!speaking && !isRecording && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {lang === "ar"
                      ? "💡 اضغط استمع ← استمع للجملة ← كرّرها بصوتك ← سجّل"
                      : "💡 Press Listen → hear the sentence → repeat it → record"}
                  </p>
                )}
              </div>

              <Button
                onClick={handleComplete}
                className="w-full h-16 md:h-20 text-xl md:text-2xl font-black rounded-full bg-green-500 hover:bg-green-600 text-white shadow-[0_8px_0_0_#16a34a] hover:shadow-[0_4px_0_0_#16a34a] hover:translate-y-1 transition-all"
              >
                <CheckCircle2 className="w-7 h-7 me-2" />
                {lang === "ar" ? "أنهيت التمرين!" : "I'm done!"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
