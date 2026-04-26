import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  gradient?: "primary" | "secondary" | "purple" | "pink" | "success" | "aurora";
}

export function PageHeader({ title, subtitle, icon, actions, gradient = "primary" }: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-6 md:p-8 mb-6 text-white shadow-xl", `gradient-${gradient}`)}>
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm md:text-base opacity-90 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
