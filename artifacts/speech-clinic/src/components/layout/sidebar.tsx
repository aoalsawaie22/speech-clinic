import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  Activity,
  LogOut,
  X,
  Stethoscope,
  Smile,
  MessageSquare,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLink { href: string; key: string; icon: LucideIcon }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const { play } = useSounds();
  const [location] = useLocation();

  if (!user || user.role === "child") return null;

  const adminLinks: NavLink[] = [
    { href: "/admin", key: "nav.home", icon: LayoutDashboard },
    { href: "/admin/specialists", key: "nav.specialists", icon: UserCog },
    { href: "/admin/children", key: "nav.children", icon: Smile },
    { href: "/admin/appointments", key: "nav.appointments", icon: Calendar },
    { href: "/admin/users", key: "nav.users", icon: Users },
    { href: "/messages", key: "nav.messages", icon: MessageSquare },
    { href: "/settings", key: "nav.settings", icon: SettingsIcon },
  ];

  const specialistLinks: NavLink[] = [
    { href: "/specialist", key: "nav.home", icon: LayoutDashboard },
    { href: "/specialist/children", key: "nav.myChildren", icon: Smile },
    { href: "/specialist/appointments", key: "nav.appointments", icon: Calendar },
    { href: "/specialist/exercises", key: "nav.exercises", icon: Activity },
    { href: "/messages", key: "nav.messages", icon: MessageSquare },
    { href: "/settings", key: "nav.settings", icon: SettingsIcon },
  ];

  const parentLinks: NavLink[] = [
    { href: "/parent", key: "nav.home", icon: LayoutDashboard },
    { href: "/parent/children", key: "nav.myChildren", icon: Smile },
    { href: "/parent/appointments", key: "nav.appointments", icon: Calendar },
    { href: "/messages", key: "nav.messages", icon: MessageSquare },
    { href: "/settings", key: "nav.settings", icon: SettingsIcon },
  ];

  const links =
    user.role === "admin" ? adminLinks :
    user.role === "specialist" ? specialistLinks :
    parentLinks;

  const handleLogout = () => {
    play("swoosh");
    logout();
  };

  const sideClass = lang === "ar" ? "right-0 border-l" : "left-0 border-r";
  const transformClosed = lang === "ar" ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0";

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 z-40 w-64 bg-card transform transition-transform duration-200 ease-in-out flex flex-col",
          sideClass,
          isOpen ? "translate-x-0" : transformClosed
        )}
      >
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gradient-primary">{t("brand.name")}</h2>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location === link.href ||
              (link.href !== `/${user.role}` && location.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "gradient-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => { play("click"); onClose(); }}
              >
                <Icon className="h-5 w-5" />
                {t(link.key)}
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
