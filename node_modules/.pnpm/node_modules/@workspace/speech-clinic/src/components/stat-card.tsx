import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  gradient?: string;
  delta?: { value: string; positive?: boolean };
  delay?: number;
}

export function StatCard({ label, value, icon, gradient, delta, delay = 0 }: StatCardProps) {
  const gradientClass = gradient && gradient.startsWith("from-") ? `bg-gradient-to-br ${gradient}` : `gradient-${gradient || "primary"}`;
  return (
    <div
      className="card-hover bg-card border rounded-2xl p-5 relative overflow-hidden animate-slide-up-fade"
      style={{ animationDelay: `${delay * 1000}ms` }}
    >
      <div className={cn("absolute -top-8 -end-8 w-32 h-32 rounded-full opacity-10", gradientClass)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2 text-gradient-primary truncate">{value}</p>
          {delta && (
            <p className={cn("text-xs mt-2 font-medium", delta.positive ? "text-emerald-600" : "text-rose-600")}>
              {delta.positive ? "↑" : "↓"} {delta.value}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl text-white shadow-lg shrink-0", gradientClass)}>
          <span className="block [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
        </div>
      </div>
    </div>
  );
}
