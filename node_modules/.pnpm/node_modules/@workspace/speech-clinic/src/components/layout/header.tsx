import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Globe, Moon, Sun, Volume2, VolumeX, Menu, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSounds } from "@/lib/sounds";
import { useAuth } from "@/hooks/use-auth";
import { messagesApi } from "@/lib/api";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play } = useSounds();
  const { user } = useAuth();
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const m = await messagesApi.unreadCount(user.id);
        setUnreadMsg(m.count);
      } catch (_e) {/* ignore */}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user?.id]);


  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-6 gap-2">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder={t("common.search")}
            className="bg-transparent border-0 outline-none text-sm flex-1"
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Messages quick access */}
        {user && user.role !== "child" && (
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="relative" onClick={() => play("click")}>
              <MessageSquare className="h-5 w-5" />
              {unreadMsg > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]">
                  {unreadMsg}
                </Badge>
              )}
            </Button>
          </Link>
        )}

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => play("click")}>
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setLang("ar"); play("pop"); }} className={lang === "ar" ? "bg-accent" : ""}>
              🇸🇦 العربية
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLang("en"); play("pop"); }} className={lang === "en" ? "bg-accent" : ""}>
              🇺🇸 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sound toggle */}
        <Button variant="ghost" size="icon" onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playSafe("pop"); }}>
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={() => { play("click"); toggleTheme(); }}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}

