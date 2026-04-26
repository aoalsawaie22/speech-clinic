import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { achievementsApi, type ChildAchievementsResp, type Achievement } from "@/lib/api";
import { useGetParentDashboard } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export default function AchievementsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [childId, setChildId] = useState<number | null>(null);
  const [data, setData] = useState<ChildAchievementsResp | null>(null);

  // For parents we need a child id; for child user the childId is on user
  const parentDash = useGetParentDashboard(user?.parentId ?? 0, { query: { enabled: user?.role === "parent" && !!user.parentId } });

  useEffect(() => {
    if (user?.role === "child" && user.childId) setChildId(user.childId);
    else if (user?.role === "parent") {
      const kids = (parentDash.data as any)?.children;
      if (kids && kids.length > 0 && !childId) setChildId(kids[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, parentDash.data]);

  useEffect(() => {
    if (!childId) return;
    achievementsApi.childAchievements(childId).then(setData).catch(() => {});
  }, [childId]);

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  const completion = data.totalAvailable > 0 ? Math.round((data.totalEarned / data.totalAvailable) * 100) : 0;
  const kids: any[] = (parentDash.data as any)?.children ?? [];

  return (
    <div>
      <PageHeader
        title={t("ach.title")}
        subtitle={`${data.totalEarned} / ${data.totalAvailable} • ${data.totalPoints} ${t("common.points")}`}
        icon={<Trophy className="h-7 w-7" />}
        gradient="secondary"
      />

      {user?.role === "parent" && kids.length > 1 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {kids.map(k => (
            <button
              key={k.id}
              onClick={() => setChildId(k.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition",
                childId === k.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              )}
            >
              {k.name}
            </button>
          ))}
        </div>
      )}

      <Card className="mb-6 card-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{lang === "ar" ? "نسبة الإنجاز" : "Achievement Progress"}</h3>
            <span className="text-2xl font-bold text-gradient-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="grid w-full md:w-96 grid-cols-2">
          <TabsTrigger value="earned">⭐ {t("ach.earned")} ({data.earned.length})</TabsTrigger>
          <TabsTrigger value="locked">🔒 {t("ach.locked")} ({data.available.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="earned" className="mt-6">
          {data.earned.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              {lang === "ar" ? "لا توجد إنجازات بعد. ابدأ بالتمارين!" : "No achievements yet. Start exercising!"}
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.earned.map((a, i) => <AchievementCard key={a.id} a={a} earned delay={i * 50} lang={lang} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="locked" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.available.map((a, i) => <AchievementCard key={a.id} a={a} delay={i * 50} lang={lang} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AchievementCard({ a, earned, delay, lang }: { a: Achievement; earned?: boolean; delay: number; lang: "ar" | "en" }) {
  return (
    <Card
      className={cn(
        "card-hover animate-pop-in relative overflow-hidden",
        earned ? "border-secondary/40 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30" : "opacity-70"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {earned && <div className="absolute top-2 right-2 text-2xl animate-glow">⭐</div>}
      <CardContent className="p-5 text-center">
        <div className={cn("text-6xl mb-3 inline-block", earned ? "animate-float" : "grayscale")}>
          {earned ? a.emoji : <Lock className="h-12 w-12 mx-auto text-muted-foreground" />}
        </div>
        <h3 className="font-bold text-lg mb-1">{lang === "ar" ? a.title : a.titleEn}</h3>
        <p className="text-sm text-muted-foreground mb-3">{lang === "ar" ? a.description : a.descriptionEn}</p>
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-bold">
          <Star className="h-3.5 w-3.5 fill-current" /> {a.points}
        </div>
        {earned && a.earnedAt && (
          <p className="text-[11px] text-muted-foreground mt-2">{formatDate(a.earnedAt, lang)}</p>
        )}
      </CardContent>
    </Card>
  );
}
