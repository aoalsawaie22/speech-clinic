import { useEffect, useState } from "react";

interface ConfettiProps {
  trigger?: boolean;
  active?: boolean;
  duration?: number;
  count?: number;
  onDone?: () => void;
}

const colors = ["#0EA5E9", "#F59E0B", "#10B981", "#A855F7", "#EC4899", "#FBBF24", "#6366F1"];

export function Confetti({ trigger, active, duration = 2400, count = 70, onDone }: ConfettiProps) {
  const fire = trigger || active;
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number; size: number }[]>([]);

  useEffect(() => {
    if (!fire) return;
    const arr = Array.from({ length: count }, (_, i) => ({
      id: i + Date.now(),
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 10,
    }));
    setPieces(arr);
    const t = setTimeout(() => { setPieces([]); onDone?.(); }, duration + 600);
    return () => clearTimeout(t);
  }, [fire, count, duration, onDone]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            background: p.color,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${duration / 1000}s`,
          }}
        />
      ))}
    </div>
  );
}
