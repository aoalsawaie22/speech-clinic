import { useGetParentDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, Calendar, TrendingUp, Heart, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";

const progressColors: Record<string, string> = {
  "متقدم": "from-emerald-500 to-teal-500",
  "متوسط": "from-amber-500 to-orange-500",
  "مبتدئ": "from-blue-500 to-cyan-500",
};
const progressPercent: Record<string, number> = { "متقدم": 80, "متوسط": 50, "مبتدئ": 20 };
const progressLabel = (lvl: string, lang: "ar" | "en") => {
  if (lang === "ar") return lvl;
  return lvl === "متقدم" ? "Advanced" : lvl === "متوسط" ? "Intermediate" : "Beginner";
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data: dashboard, isLoading } = useGetParentDashboard(user?.parentId || 0, {
    query: { enabled: !!user?.parentId },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      </div>
    );
  }
  if (!dashboard) return <div className="text-center py-12 text-muted-foreground">{t("common.noData")}</div>;

  return (
    <div>
      <PageHeader
        title={`${lang === "ar" ? "مرحباً" : "Welcome"}, ${user?.name}`}
        subtitle={lang === "ar" ? "تابع تقدم أطفالك في رحلة العلاج" : "Track your children's therapy journey"}
        icon={<Heart className="h-7 w-7" />}
        gradient="success"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label={lang === "ar" ? "أطفالي" : "My Children"} value={dashboard.children.length} icon={<Heart />} gradient="from-pink-500 to-rose-500" delay={0} />
        <StatCard label={t("dash.upcomingAppointments")} value={dashboard.upcomingAppointments.length} icon={<Calendar />} gradient="from-amber-500 to-orange-500" delay={0.05} />
        <StatCard label={t("dash.avgProgress")} value={`${dashboard.totalProgress}%`} icon={<TrendingUp />} gradient="from-emerald-500 to-teal-500" delay={0.1} />
      </div>

      {dashboard.children.length > 0 && (
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" /> {lang === "ar" ? "متابعة أطفالي" : "Children Tracking"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.children.map((child: any) => {
              const colorGradient = progressColors[child.progressLevel] || progressColors["مبتدئ"];
              const pct = progressPercent[child.progressLevel] || 20;
              return (
                <Card key={child.id} className="card-hover overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${colorGradient}`} />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                          {child.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{child.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {child.age} {lang === "ar" ? "سنوات" : "yrs"}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-3xl text-gradient-primary">{pct}%</p>
                        <p className="text-xs font-medium text-muted-foreground">{progressLabel(child.progressLevel, lang)}</p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {dashboard.upcomingAppointments.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> {t("dash.upcomingAppointments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.upcomingAppointments.map((apt: any) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{apt.childName}</p>
                    <p className="text-xs text-muted-foreground">{apt.specialistName}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm font-medium">{formatDate(apt.date, lang)}</p>
                  <p className="text-xs text-muted-foreground">{apt.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
