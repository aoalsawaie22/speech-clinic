import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useSounds } from "@/lib/sounds";
import { messagesApi, type Conversation } from "@/lib/api";
import { useListUsers } from "@workspace/api-client-react";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { play } = useSounds();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const allUsers = useListUsers();
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    if (!user) return;
    const data = await messagesApi.conversations(user.id);
    setConvos(data);
    if (!activeId && data.length > 0) setActiveId(data[0].otherUserId);
  };

  useEffect(() => { refresh(); const id = setInterval(refresh, 15000); return () => clearInterval(id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  useEffect(() => {
    if (activeId && user) messagesApi.markRead(user.id, activeId).catch(() => {});
  }, [activeId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [convos, activeId]);

  const active = convos.find(c => c.otherUserId === activeId);

  // Auto-pick recipient: parents talk to specialists and vice versa
  const eligibleRecipients = (allUsers.data ?? []).filter((u: any) => {
    if (!user) return false;
    if (u.id === user.id) return false;
    if (user.role === "parent") return u.role === "specialist";
    if (user.role === "specialist") return u.role === "parent";
    if (user.role === "admin") return u.role !== "child";
    return false;
  });

  const startConvoWith = (uid: number) => {
    if (!convos.find(c => c.otherUserId === uid)) {
      const u: any = (allUsers.data ?? []).find((x: any) => x.id === uid);
      setConvos(prev => [
        { otherUserId: uid, otherUserName: u?.name ?? "User", otherUserRole: u?.role ?? "user", lastMessage: "", lastDate: new Date().toISOString(), unreadCount: 0, messages: [] },
        ...prev,
      ]);
    }
    setActiveId(uid);
  };

  const send = async () => {
    if (!user || !activeId || !input.trim()) return;
    play("click");
    await messagesApi.send({ fromUserId: user.id, toUserId: activeId, content: input.trim() });
    setInput("");
    refresh();
  };

  return (
    <div>
      <PageHeader
        title={t("msg.title")}
        icon={<MessageSquare className="h-7 w-7" />}
        gradient="pink"
      />

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr] min-h-[520px]">
          {/* Conversations list */}
          <div className="border-e bg-muted/20 overflow-y-auto max-h-[600px]">
            <div className="p-3 border-b">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{t("msg.newMessage")}</p>
              <select
                className="w-full bg-card border rounded-lg px-3 py-2 text-sm"
                onChange={(e) => { if (e.target.value) startConvoWith(parseInt(e.target.value, 10)); e.target.value = ""; }}
                defaultValue=""
              >
                <option value="" disabled>{lang === "ar" ? "اختر مستخدم..." : "Choose a user..."}</option>
                {eligibleRecipients.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} • {t(`role.${u.role}`)}</option>
                ))}
              </select>
            </div>
            {convos.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">{t("msg.empty")}</div>
            )}
            {convos.map(c => (
              <button
                key={c.otherUserId}
                onClick={() => { play("click"); setActiveId(c.otherUserId); }}
                className={cn(
                  "w-full text-start p-3 border-b hover:bg-muted/40 transition",
                  activeId === c.otherUserId && "bg-primary/10 border-l-4 border-l-primary"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {c.otherUserName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.otherUserName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage || (lang === "ar" ? "محادثة جديدة" : "New conversation")}</p>
                    </div>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">{c.unreadCount}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active conversation */}
          <div className="flex flex-col">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
                <div>
                  <MessageSquare className="h-16 w-16 mx-auto opacity-30 mb-3" />
                  <p>{t("msg.selectConvo")}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center gap-3 bg-card">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                    {active.otherUserName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{active.otherUserName}</p>
                    <p className="text-xs text-muted-foreground">{t(`role.${active.otherUserRole}`)}</p>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
                  {active.messages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-6">{t("msg.empty")}</p>
                  )}
                  {active.messages.map(m => (
                    <div key={m.id} className={cn("flex", m.isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 animate-pop-in",
                        m.isMine ? "gradient-primary text-white" : "bg-muted"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={cn("text-[10px] mt-1", m.isMine ? "text-white/70" : "text-muted-foreground")}>
                          {formatRelative(m.createdAt, lang)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t flex items-center gap-2 bg-card">
                  <Input
                    placeholder={t("msg.placeholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  />
                  <Button onClick={send} disabled={!input.trim()} className="gradient-primary">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
