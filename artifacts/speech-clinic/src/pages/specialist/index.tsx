import { useGetSpecialistDashboard, useListSessions, useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smile, Calendar, Activity, Star, Clock, TrendingUp, Stethoscope } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { formatDate } from "@/lib/format";

export default function SpecialistDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data: dashboard, isLoading } = useGetSpecialistDashboard(user?.specialistId || 0, {
    query: { enabled: !!user?.specialistId },
  });
  const { data: sessions } = useListSessions({ query: { specialistId: user?.specialistId } });
  const { data: appointments } = useListAppointments({ query: { specialistId: user?.specialistId } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (!dashboard) return <div className="text-center py-12 text-muted-foreground">{t("common.noData")}</div>;

  const upcoming = (appointments ?? []).filter((a: any) => a.status === "scheduled");
  const recent = (sessions ?? []).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`${lang === "ar" ? "مرحباً" : "Welcome"}, ${user?.name}`}
        subtitle={lang === "ar" ? "ملخص نشاطك العلاجي" : "Your therapy activity overview"}
        icon={<Stethoscope className="h-7 w-7" />}
        gradient="purple"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("dash.activeChildren")} value={dashboard.activeChildren} icon={<Smile />} gradient="from-blue-500 to-cyan-500" delay={0} />
        <StatCard label={t("dash.weekSessions")} value={dashboard.sessionsThisWeek} icon={<Calendar />} gradient="from-purple-500 to-pink-500" delay={0.05} />
        <StatCard label={t("dash.monthSessions")} value={dashboard.sessionsThisMonth} icon={<Activity />} gradient="from-emerald-500 to-teal-500" delay={0.1} />
        <StatCard label={t("dash.avgScore")} value={`${dashboard.averageScore}/10`} icon={<Star />} gradient="from-amber-500 to-orange-500" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> {t("dash.recentSessions")}
            </CardTitle>
            <Badge variant="secondary">{recent.length}</Badge>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{t("dash.noSessions")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">{s.childName?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{s.childName}</p>
                        <p className="text-xs text-muted-foreground">{s.duration} {t("common.minutes")}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium">{formatDate(s.date, lang)}</p>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs text-muted-foreground">{s.score}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> {t("dash.upcomingAppointments")}
            </CardTitle>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{t("dash.noAppointments")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <p className="font-medium text-sm">{apt.childName}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium">{formatDate(apt.date, lang)}</p>
                      <p className="text-xs text-muted-foreground">{apt.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
