import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <>{children}</>;

  // Child interface is full screen without sidebar
  if (user.role === "child") {
    return <div className="min-h-screen font-sans">{children}</div>;
  }

  const mainOffset = lang === "ar" ? "md:mr-64" : "md:ml-64";

  return (
    <div className="min-h-screen flex bg-background bg-blobs font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`flex-1 ${mainOffset} transition-all duration-300 w-full flex flex-col min-h-screen`}>
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
