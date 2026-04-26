import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import { notificationsApi, type AppNotification } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { play } = useSounds();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationsApi.list(user.id);
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const markRead = async (id: number) => {
    play("click");
    await notificationsApi.markRead(id);
    refresh();
  };

  const remove = async (id: number) => {
    play("swoosh");
    await notificationsApi.remove(id);
    refresh();
  };

  const markAll = async () => {
    if (!user) return;
    play("success");
    await notificationsApi.markAllRead(user.id);
    refresh();
  };

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div>
      <PageHeader
        title={t("nav.notifications")}
        subtitle={`${items.length} ${lang === "ar" ? "إشعار" : "notifications"}`}
        icon={<Bell className="h-7 w-7" />}
        gradient="primary"
        actions={
          unreadCount > 0 ? (
            <Button onClick={markAll} className="bg-white text-primary hover:bg-white/90">
              <Check className="me-2 h-4 w-4" /> {t("common.markAllRead")}
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-16 w-16 mx-auto opacity-30 mb-3" />
            <p className="text-muted-foreground">{t("notif.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n, i) => (
            <Card
              key={n.id}
              className={cn("card-hover animate-slide-up-fade", !n.read && "border-primary/40 bg-primary/5")}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0", typeBg(n.type))}>
                  {typeEmoji(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{lang === "ar" ? n.title : n.titleEn}</h3>
                    {!n.read && <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-primary text-primary-foreground rounded-full">{t("notif.unread")}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{lang === "ar" ? n.message : n.messageEn}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatRelative(n.createdAt, lang)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <Button variant="ghost" size="icon" onClick={() => markRead(n.id)} title={t("common.markRead")}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => remove(n.id)} className="text-destructive hover:text-destructive" title={t("common.delete")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function typeEmoji(t: string) {
  switch (t) {
    case "success": return "✅";
    case "warning": return "⚠️";
    case "appointment": return "📅";
    case "session": return "📋";
    case "achievement": return "🏆";
    case "message": return "💬";
    default: return "🔔";
  }
}

function typeBg(t: string) {
  switch (t) {
    case "success": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950";
    case "warning": return "bg-amber-100 text-amber-700 dark:bg-amber-950";
    case "appointment": return "bg-blue-100 text-blue-700 dark:bg-blue-950";
    case "session": return "bg-purple-100 text-purple-700 dark:bg-purple-950";
    case "achievement": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950";
    case "message": return "bg-pink-100 text-pink-700 dark:bg-pink-950";
    default: return "bg-primary/10 text-primary";
  }
}
