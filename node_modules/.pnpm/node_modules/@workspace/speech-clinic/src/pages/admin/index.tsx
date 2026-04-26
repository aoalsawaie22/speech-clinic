import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smile, Stethoscope, Calendar, TrendingUp, LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { formatDate } from "@/lib/format";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (!dashboard) return <div className="text-center py-12 text-muted-foreground">{t("common.noData")}</div>;

  return (
    <div>
      <PageHeader
        title={`${lang === "ar" ? "أهلاً" : "Welcome"}, ${user?.name}`}
        subtitle={lang === "ar" ? "لوحة تحكم الإدارة - نظرة عامة" : "Admin Dashboard - Overview"}
        icon={<LayoutDashboard className="h-7 w-7" />}
        gradient="primary"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label={t("dash.totalChildren")} value={dashboard.totalChildren} icon={<Smile />} gradient="from-blue-500 to-cyan-500" delay={0} />
        <StatCard label={t("dash.totalSpecialists")} value={dashboard.totalSpecialists} icon={<Stethoscope />} gradient="from-purple-500 to-pink-500" delay={0.05} />
        <StatCard label={t("dash.todayAppointments")} value={dashboard.appointmentsToday} icon={<Calendar />} gradient="from-amber-500 to-orange-500" delay={0.1} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("dash.upcomingAppointments")}
            </CardTitle>
            <Badge variant="secondary">{dashboard.upcomingAppointments.length}</Badge>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{t("dash.noAppointments")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.upcomingAppointments.map((a: any) => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{a.childName}</p>
                        <p className="text-xs text-muted-foreground">{a.specialistName}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium">{formatDate(a.date, lang)}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
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
