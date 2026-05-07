import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

type SoundName = "click" | "success" | "error" | "achievement" | "complete" | "pop" | "swoosh" | "notification";

interface SoundCtx {
  enabled: boolean;
  setEnabled: (e: boolean) => void;
  play: (name: SoundName) => void;
  speak: (text: string, lang?: "ar-SA" | "en-US" | "ar" | "en") => void;
}

const SoundContext = createContext<SoundCtx | undefined>(undefined);

function createTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = "sine", gainStart = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gainStart, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

function playSound(name: SoundName) {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const t = ctx.currentTime;

    switch (name) {
      case "click":
        createTone(ctx, 700, 0.07, "triangle", 0.12);
        break;
      case "pop":
        createTone(ctx, 880, 0.08, "triangle", 0.15);
        setTimeout(() => createTone(ctx, 1320, 0.08, "triangle", 0.12), 40);
        break;
      case "success":
        createTone(ctx, 523, 0.12, "sine", 0.18);
        setTimeout(() => createTone(ctx, 659, 0.12, "sine", 0.18), 100);
        setTimeout(() => createTone(ctx, 784, 0.18, "sine", 0.2), 200);
        break;
      case "complete":
        createTone(ctx, 523, 0.1, "sine", 0.2);
        setTimeout(() => createTone(ctx, 659, 0.1, "sine", 0.2), 90);
        setTimeout(() => createTone(ctx, 784, 0.1, "sine", 0.2), 180);
        setTimeout(() => createTone(ctx, 1046, 0.25, "sine", 0.22), 270);
        break;
      case "achievement":
        const notes = [523, 659, 784, 1046, 784, 1046, 1318];
        notes.forEach((n, i) => setTimeout(() => createTone(ctx, n, 0.15, "triangle", 0.2), i * 80));
        break;
      case "error":
        createTone(ctx, 220, 0.15, "sawtooth", 0.15);
        setTimeout(() => createTone(ctx, 180, 0.18, "sawtooth", 0.13), 120);
        break;
      case "swoosh":
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      case "notification":
        createTone(ctx, 880, 0.1, "sine", 0.15);
        setTimeout(() => createTone(ctx, 1100, 0.15, "sine", 0.15), 80);
        break;
    }

    setTimeout(() => ctx.close(), 1500);
  } catch (_e) {
    // ignore
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("speech_clinic_sound");
    return v === null ? true : v === "1";
  });

  const setEnabled = (e: boolean) => {
    localStorage.setItem("speech_clinic_sound", e ? "1" : "0");
    setEnabledState(e);
  };

  const play = (name: SoundName) => {
    if (!enabled) return;
    playSound(name);
  };

  const speakFn = (text: string, lang: "ar-SA" | "en-US" | "ar" | "en" = "ar-SA") => {
    if (!enabled) return;
    speak(text, lang.startsWith("en") ? "en" : "ar");
  };

  return (
    <SoundContext.Provider value={{ enabled, setEnabled, play, speak: speakFn }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSounds(): SoundCtx {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSounds must be used within SoundProvider");
  return ctx;
}

// Wait for voices to be loaded (some browsers load them asynchronously)
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const v = window.speechSynthesis.getVoices();
    if (v && v.length) { resolve(v); return; }
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(() => { if (!done) { done = true; resolve(window.speechSynthesis.getVoices()); } }, 600);
  });
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: "ar" | "en"): SpeechSynthesisVoice | undefined {
  const target = lang === "ar" ? "ar" : "en";
  const exact = voices.find(v => v.lang.toLowerCase().startsWith(target));
  if (exact) return exact;
  return voices[0];
}

export async function hasVoiceFor(lang: "ar" | "en"): Promise<boolean> {
  const voices = await getVoices();
  const target = lang === "ar" ? "ar" : "en";
  return voices.some(v => v.lang.toLowerCase().startsWith(target));
}

// Global controller for pause/resume/stop across sequences
const speechCtrl = {
  paused: false,
  stopped: false,
};

export function pauseSpeech() {
  speechCtrl.paused = true;
  try { window.speechSynthesis.pause(); } catch {}
}

export function resumeSpeech() {
  speechCtrl.paused = false;
  try { window.speechSynthesis.resume(); } catch {}
}

export function stopSpeech() {
  speechCtrl.stopped = true;
  speechCtrl.paused = false;
  try { window.speechSynthesis.cancel(); } catch {}
}

// Speaks one utterance and returns a promise that resolves when speech ends
export async function speak(text: string, lang: "ar" | "en" = "ar", rate?: number): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try { window.speechSynthesis.cancel(); } catch {}
  await new Promise(r => setTimeout(r, 80));
  const voices = await getVoices();
  const voice = pickVoice(voices, lang);

  return new Promise<void>((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "ar" ? "ar-SA" : "en-US";
      // أبطأ للعربية حتى يفهم الطفل جيداً
      utter.rate = rate ?? (lang === "ar" ? 0.7 : 0.9);
      utter.pitch = lang === "ar" ? 1.0 : 1.1;
      utter.volume = 1;
      if (voice) utter.voice = voice;
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      utter.onend = finish;
      utter.onerror = finish;
      window.speechSynthesis.speak(utter);
      // وقت أمان أطول للنص العربي (180ms لكل حرف، حد أدنى 3 ثواني)
      setTimeout(finish, Math.max(3000, text.length * 180));
    } catch {
      resolve();
    }
  });
}

// Cancellable wait that respects pause/stop
async function waitWithControl(ms: number) {
  const step = 100;
  let elapsed = 0;
  while (elapsed < ms) {
    if (speechCtrl.stopped) return;
    while (speechCtrl.paused && !speechCtrl.stopped) {
      await new Promise(r => setTimeout(r, 150));
    }
    if (speechCtrl.stopped) return;
    await new Promise(r => setTimeout(r, step));
    elapsed += step;
  }
}

// Speak multiple chunks in sequence with pauses (supports pause/resume/stop)
export async function speakSequence(chunks: string[], lang: "ar" | "en" = "ar", pauseMs = 700): Promise<void> {
  speechCtrl.stopped = false;
  speechCtrl.paused = false;
  for (const c of chunks) {
    if (!c.trim()) continue;
    if (speechCtrl.stopped) return;
    while (speechCtrl.paused && !speechCtrl.stopped) {
      await new Promise(r => setTimeout(r, 150));
    }
    if (speechCtrl.stopped) return;
    await speak(c, lang);
    await waitWithControl(pauseMs);
  }
}

// =========================================================
// speakExercise: تدفق متخصص للتمارين الكلامية للأطفال
// الترتيب: مقدمة → جملة ببطء → توقف → "كرّر معي" → جملة → توقف طويل للطفل
// =========================================================
export async function speakExercise(
  chunks: string[],
  lang: "ar" | "en",
  onChunkStart?: (idx: number, total: number) => void
): Promise<void> {
  speechCtrl.stopped = false;
  speechCtrl.paused = false;

  const repeatCue = lang === "ar" ? "كرّر معي" : "Now you try";
  const wellDone   = lang === "ar" ? "ممتاز!" : "Well done!";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.trim()) continue;
    if (speechCtrl.stopped) return;

    onChunkStart?.(i, chunks.length);

    // 1️⃣ قول الجملة ببطء (المعلم يقول)
    await speak(chunk, lang, lang === "ar" ? 0.65 : 0.85);
    await waitWithControl(600);
    if (speechCtrl.stopped) return;

    // 2️⃣ "كرّر معي"
    await speak(repeatCue, lang, lang === "ar" ? 0.8 : 0.9);
    await waitWithControl(400);
    if (speechCtrl.stopped) return;

    // 3️⃣ إعادة الجملة مرة ثانية (أبطأ)
    await speak(chunk, lang, lang === "ar" ? 0.6 : 0.8);
    if (speechCtrl.stopped) return;

    // 4️⃣ توقف طويل ← وقت الطفل للتكرار (2.5 ثانية)
    await waitWithControl(2500);
    if (speechCtrl.stopped) return;

    // 5️⃣ "ممتاز" بين الأجزاء (مش بعد آخر جزء)
    if (i < chunks.length - 1) {
      await speak(wellDone, lang, 0.9);
      await waitWithControl(500);
    }
  }
}
