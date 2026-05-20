import { useEffect, useRef, useState, useMemo } from "react";
import { useListExercises, useGetChild } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, Mic, Play, Square, RotateCcw, LogOut, Star, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import { speakExercise, hasVoiceFor, pauseSpeech, resumeSpeech, stopSpeech } from "@/lib/sounds";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────
function parseAssignedIds(notes: string | null | undefined): number[] | null {
  if (!notes) return null;
  try {
    const p = JSON.parse(notes);
    if (Array.isArray(p?.exercises) && p.exercises.length > 0) return p.exercises as number[];
  } catch {}
  return null;
}

function extractChunks(instructions: string): string[] {
  return instructions.split("\n").map(s => s.trim()).filter(s => s.length > 0);
}

const CATEGORY_LABELS: Record<string, string> = {
  pronunciation: "نطق", breathing: "تنفس", oral_muscle: "عضلات الفم",
  listening: "استماع", vocabulary: "مفردات", fluency: "طلاقة", rhythm: "إيقاع",
};

export default function ChildExercises() {
  const { user, logout } = useAuth();
  const { lang } = useI18n();
  const { play, enabled: soundEnabled } = useSounds();
  const { toast } = useToast();

  const [selectedId, setSelectedId]       = useState<number | null>(null);
  const [speaking, setSpeaking]           = useState(false);
  const [paused, setPaused]               = useState(false);
  const [activeChunkIdx, setActiveChunkIdx] = useState<number | null>(null);
  const lastChunksRef = useRef<{ chunks: string[]; lang: "ar"|"en" }|null>(null);

  const [isRecording, setIsRecording]   = useState(false);
  const [recordedUrl, setRecordedUrl]   = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream|null>(null);

  // ── Fetch all exercises ───────────────────────────────────────────────
  const { data: allExercises, isLoading: exLoading } = useListExercises();

  // ── Fetch THIS child's data to get assigned exercise IDs ──────────────
  const childId = user?.childId;
  const { data: childData, isLoading: childLoading } = useGetChild(
    String(childId ?? ""),
    { query: { enabled: !!childId } }
  );

  // ── Filter to assigned exercises only ─────────────────────────────────
  const exercises = useMemo(() => {
    if (!allExercises) return [];
    const assignedIds = parseAssignedIds(childData?.notes);
    if (!assignedIds) return allExercises;
    return allExercises.filter(ex => assignedIds.includes(ex.id));
  }, [allExercises, childData?.notes]);

  // Grouped by category for sidebar
  const grouped = useMemo(() => exercises.reduce<Record<string, typeof exercises>>((acc, ex) => {
    const cat = ex.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {}), [exercises]);

  const selectedExercise = exercises.find(e => e.id === selectedId) ?? null;
  const currentChunks    = selectedExercise ? extractChunks(selectedExercise.instructions) : [];

  const isLoading = exLoading || childLoading;

  // Reset state when switching exercise
  const handleSelectExercise = (id: number) => {
    stopSpeech();
    setSpeaking(false); setPaused(false); setActiveChunkIdx(null);
    lastChunksRef.current = null;
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null); setIsRecording(false);
    setSelectedId(id);
    play("click");
  };

  useEffect(() => () => {
    stopSpeech();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    streamRef.current?.getTracks().forEach(t => t.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── TTS ───────────────────────────────────────────────────────────────
  const playInstructions = async () => {
    if (!soundEnabled) {
      toast({ title: "الصوت معطّل", description: "فعّل الصوت أولاً", variant: "destructive" });
      return;
    }
    if (!selectedExercise || speaking) return;
    play("click");
    const lc: "ar"|"en" = "ar";
    const ok = await hasVoiceFor(lc);
    if (!ok) {
      toast({
        title: "لا يوجد صوت عربي مثبّت",
        description: "افتح إعدادات Windows ← الوقت واللغة ← اللغة ← أضِف العربية مع حزمة الصوت.",
        variant: "destructive",
      });
      return;
    }
    const chunks = extractChunks(selectedExercise.instructions);
    lastChunksRef.current = { chunks, lang: lc };
    setSpeaking(true); setActiveChunkIdx(null);
    try { await speakExercise(chunks, lc, idx => setActiveChunkIdx(idx)); }
    finally { setSpeaking(false); setActiveChunkIdx(null); }
  };

  const pauseSpeaking  = () => { pauseSpeech();  setPaused(true);  play("click"); };
  const resumeSpeaking = () => { resumeSpeech(); setPaused(false); play("click"); };
  const stopSpeaking   = () => { stopSpeech();   setSpeaking(false); setPaused(false); setActiveChunkIdx(null); play("swoosh"); };

  const repeatSpeaking = async () => {
    const last = lastChunksRef.current;
    if (!last || speaking) return;
    stopSpeech();
    await new Promise(r => setTimeout(r, 150));
    setPaused(false); setSpeaking(true); setActiveChunkIdx(null);
    try { await speakExercise(last.chunks, last.lang, idx => setActiveChunkIdx(idx)); }
    finally { setSpeaking(false); setActiveChunkIdx(null); }
  };

  // ── Recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mr.start(); setIsRecording(true); play("pop");
    } catch {
      alert("لم نتمكن من فتح المايكروفون. الرجاء السماح بالوصول.");
    }
  };
  const stopRecording  = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); play("click"); };
  const playRecording  = () => { if (!recordedUrl) return; new Audio(recordedUrl).play().catch(() => {}); };
  const resetRecording = () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); play("swoosh"); };

  // ── Loading ───────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Skeleton className="h-64 w-[80%] rounded-3xl" />
    </div>
  );

  const assignedCount = parseAssignedIds(childData?.notes)?.length ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] dark:from-slate-900 dark:to-slate-800 font-sans flex flex-col">

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-blue-100 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm sticky top-0 z-10 flex-wrap gap-3">
        <Link href="/child" onClick={() => play("click")} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-700 rounded-full font-bold hover:bg-white transition-colors text-sm">
          <ArrowRight className="w-4 h-4" /> رجوع
        </Link>

        <div className="text-center">
          <h1 className="text-lg font-black text-primary">🗣️ تمارين {user?.name}</h1>
          {assignedCount !== null
            ? <p className="text-xs text-green-600 font-medium flex items-center gap-1 justify-center"><BookOpen className="w-3 h-3" />{exercises.length} تمرين مخصص لك</p>
            : <p className="text-xs text-muted-foreground">جميع التمارين المتاحة</p>
          }
        </div>

        <Button onClick={() => { play("swoosh"); logout(); }} size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-full font-bold">
          <LogOut className="w-4 h-4 me-1" /> خروج
        </Button>
      </header>

      {/* No exercises */}
      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 p-6">
          <div className="text-8xl">📭</div>
          <h2 className="text-2xl font-black text-slate-700 dark:text-slate-200">لا توجد تمارين بعد</h2>
          <p className="text-muted-foreground max-w-sm">لم يتم تخصيص تمارين لك حتى الآن. تواصل مع أخصائيك.</p>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="flex flex-1 h-[calc(100vh-72px)]">

          {/* Sidebar */}
          <aside className="w-64 min-w-[180px] overflow-y-auto border-e border-blue-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-3 space-y-4">
            {Object.entries(grouped).map(([cat, exList]) => (
              <div key={cat}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                {exList.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`w-full text-right px-3 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium border-2 mb-1 ${
                      selectedId === ex.id
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-white dark:bg-slate-700 border-transparent hover:border-primary/30 hover:bg-blue-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    <span className="text-xl">{ex.emoji}</span>
                    <span className="truncate">{ex.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto p-6 flex items-start justify-center pt-10">
            <AnimatePresence mode="wait">
              {!selectedExercise ? (
                <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} className="text-center text-muted-foreground space-y-4 mt-20">
                  <div className="text-8xl">👈</div>
                  <p className="text-xl font-bold">اختر تمريناً من القائمة</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedExercise.id}
                  initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-40,opacity:0}}
                  className="bg-card w-full max-w-lg rounded-[40px] shadow-2xl p-6 md:p-10 border-4 border-primary/20 text-center"
                >
                  <div className="text-6xl mb-3">{selectedExercise.emoji}</div>
                  <h2 className="text-2xl md:text-3xl font-black mb-6">{selectedExercise.title}</h2>

                  {/* Words stacked */}
                  <div className="mb-8 space-y-3">
                    {currentChunks.map((chunk, idx) => (
                      <p
                        key={idx}
                        className={`text-2xl md:text-3xl font-bold leading-relaxed transition-all duration-300 py-2 rounded-2xl ${
                          activeChunkIdx === idx
                            ? "bg-primary text-white scale-110 shadow-lg"
                            : idx === 0 ? "text-primary" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >{chunk}</p>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="bg-blue-50 dark:bg-blue-950/40 rounded-3xl p-4 mb-4 border-2 border-blue-200 dark:border-blue-800">
                    {speaking && activeChunkIdx !== null && (
                      <p className="text-xs text-primary font-bold mb-3 animate-pulse">
                        📢 كلمة {activeChunkIdx + 1} من {currentChunks.length}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button onClick={playInstructions} disabled={speaking} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold h-11 px-5 disabled:opacity-60">
                        <Volume2 className="w-5 h-5 me-2" /> استمع
                      </Button>
                      {speaking && !paused && (
                        <Button onClick={pauseSpeaking} className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold h-11 px-5">⏸ توقف</Button>
                      )}
                      {speaking && paused && (
                        <Button onClick={resumeSpeaking} className="bg-green-500 hover:bg-green-600 text-white rounded-full font-bold h-11 px-5">▶ متابعة</Button>
                      )}
                      {speaking && (
                        <Button onClick={stopSpeaking} className="bg-slate-500 hover:bg-slate-600 text-white rounded-full font-bold h-11 px-5">⏹ إيقاف</Button>
                      )}
                      {!speaking && lastChunksRef.current && (
                        <Button onClick={repeatSpeaking} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold h-11 px-5">🔁 إعادة</Button>
                      )}
                      {!isRecording && !recordedUrl && (
                        <Button onClick={startRecording} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold h-11 px-5">
                          <Mic className="w-5 h-5 me-2" /> سجّل
                        </Button>
                      )}
                      {isRecording && (
                        <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold h-11 px-5 animate-pulse">
                          <Square className="w-5 h-5 me-2 fill-white" /> أوقف
                        </Button>
                      )}
                      {recordedUrl && !isRecording && (
                        <>
                          <Button onClick={playRecording} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold h-11 px-5">
                            <Play className="w-5 h-5 me-2 fill-white" /> اسمع تسجيلك
                          </Button>
                          <Button onClick={resetRecording} variant="outline" className="rounded-full font-bold h-11 px-5">
                            <RotateCcw className="w-5 h-5 me-2" /> أعد
                          </Button>
                        </>
                      )}
                    </div>
                    {isRecording && <p className="text-xs text-red-500 mt-3 font-bold animate-pulse">● جاري التسجيل...</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  );
}