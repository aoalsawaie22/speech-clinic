import type { Lang } from "./i18n";

export function formatDate(date: string | Date, lang: Lang = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

export function formatRelative(date: string | Date, lang: Lang = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return lang === "ar" ? "الآن" : "just now";
  if (min < 60) return lang === "ar" ? `منذ ${min} د` : `${min}m ago`;
  if (hr < 24) return lang === "ar" ? `منذ ${hr} س` : `${hr}h ago`;
  if (day < 7) return lang === "ar" ? `منذ ${day} يوم` : `${day}d ago`;
  return formatDate(d, lang);
}

export function formatTime(time: string): string {
  // time is "HH:MM"
  return time;
}
