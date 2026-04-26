import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, PieChart as PieIcon, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { reportsApi, type SessionsTrendItem, type CategoryItem, type AppointmentStatusItem, type TopChild } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#0EA5E9", "#F59E0B", "#10B981", "#A855F7", "#EC4899"];

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [trend, setTrend] = useState<SessionsTrendItem[]>([]);
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [statuses, setStatuses] = useState<AppointmentStatusItem[]>([]);
  const [topKids, setTopKids] = useState<TopChild[]>([]);

  useEffect(() => {
    const specialistId = user?.role === "specialist" ? user.specialistId : undefined;
    Promise.all([
      reportsApi.sessionsTrend({ specialistId, days: 30 }),
      reportsApi.categories(),
      reportsApi.appointmentsStatus(specialistId),
      reportsApi.topChildren(specialistId),
    ]).then(([a, b, c, d]) => {
      setTrend(a); setCats(b); setStatuses(c); setTopKids(d);
    }).catch(() => {});
  }, [user]);

  const trendData = trend.map(t => ({ date: t.date.slice(5), sessions: t.sessions, score: t.avgScore }));
  const catData = cats.map(c => ({ name: t(`cat.${c.category}`), completed: c.completed, total: c.total, score: c.avgScore }));
  const statusData = statuses.filter(s => s.count > 0).map(s => ({ name: t(`status.${s.status}`), value: s.count }));

  return (
    <div>
      <PageHeader
        title={t("reports.title")}
        icon={<BarChart3 className="h-7 w-7" />}
        gradient="aurora"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions Trend */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> {t("chart.sessionsTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sessions" stroke="#0EA5E9" fillOpacity={1} fill="url(#gSessions)" name={lang === "ar" ? "الجلسات" : "Sessions"} />
                <Area type="monotone" dataKey="score" stroke="#F59E0B" fillOpacity={1} fill="url(#gScore)" name={lang === "ar" ? "متوسط الدرجة" : "Avg Score"} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-secondary" /> {t("chart.categories")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={catData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="completed" fill="#10B981" radius={[8, 8, 0, 0]} name={lang === "ar" ? "مكتملة" : "Completed"} />
                <Bar dataKey="total" fill="#0EA5E9" radius={[8, 8, 0, 0]} name={lang === "ar" ? "الإجمالي" : "Total"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments Status */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-purple-500" /> {t("chart.appointmentStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("common.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top children */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> {t("chart.topChildren")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topKids.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("common.noData")}</p>
            ) : (
              <div className="space-y-2">
                {topKids.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl card-hover">
                    <div className={
                      i === 0 ? "text-2xl" : i === 1 ? "text-xl" : i === 2 ? "text-lg" : "text-base font-bold w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                    }>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.totalSessions} {t("dash.sessions")} • {lang === "ar" ? "العمر" : "Age"}: {c.age}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient-primary">{c.progressLevel}%</p>
                      <p className="text-[10px] text-muted-foreground">{t("dash.avgProgress")}</p>
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
