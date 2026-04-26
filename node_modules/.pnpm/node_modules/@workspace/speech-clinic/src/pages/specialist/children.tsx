import { useState } from "react";
import { useListChildren } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Smile, Calendar, Activity, FileText, ChevronDown, ChevronUp } from "lucide-react";

const progressColors: Record<string, { bar: string; badge: string }> = {
  متقدم: { bar: "bg-green-500", badge: "bg-green-100 text-green-700" },
  متوسط: { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  مبتدئ: { bar: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
};

const progressPercent: Record<string, number> = {
  متقدم: 80,
  متوسط: 50,
  مبتدئ: 20,
};

export default function SpecialistChildren() {
  const { user } = useAuth();
  const { data: children, isLoading } = useListChildren({ query: { specialistId: user?.specialistId } });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">أطفالي</h1>
        <p className="text-muted-foreground text-sm mt-1">الأطفال المعينون لك للمتابعة العلاجية</p>
      </div>

      {(!children || children.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Smile className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد أطفال معينون لك حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map(child => {
            const colors = progressColors[child.progressLevel] || { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" };
            const pct = progressPercent[child.progressLevel] || 20;
            const isExpanded = expandedId === child.id;
            return (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                        {child.name?.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{child.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">العمر: {child.age} سنوات</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                      {child.progressLevel}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>مستوى التقدم</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className={`${colors.bar} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {child.diagnosis && (
                    <div className="bg-muted/40 rounded-lg p-2 text-sm">
                      <span className="text-muted-foreground">التشخيص: </span>
                      <span className="font-medium">{child.diagnosis}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>{child.totalSessions} جلسة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>جلسة أسبوعية</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full flex items-center gap-2 text-sm"
                    onClick={() => setExpandedId(isExpanded ? null : child.id)}
                  >
                    <FileText className="h-4 w-4" />
                    {isExpanded ? "إخفاء التفاصيل" : "عرض الملاحظات"}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {isExpanded && (
                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">ملاحظات سريرية:</p>
                      <p>{child.notes || "لا توجد ملاحظات مسجلة بعد."}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
