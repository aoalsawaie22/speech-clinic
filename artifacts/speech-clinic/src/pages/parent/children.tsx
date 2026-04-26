import { useListChildren } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Activity, Stethoscope } from "lucide-react";

const progressColors: Record<string, { bar: string; badge: string; text: string }> = {
  متقدم: { bar: "bg-green-500", badge: "bg-green-100", text: "text-green-700" },
  متوسط: { bar: "bg-amber-500", badge: "bg-amber-100", text: "text-amber-700" },
  مبتدئ: { bar: "bg-blue-500", badge: "bg-blue-100", text: "text-blue-700" },
};
const progressPercent: Record<string, number> = { متقدم: 80, متوسط: 50, مبتدئ: 20 };

export default function ParentChildren() {
  const { user } = useAuth();
  const { data: children, isLoading } = useListChildren({ query: { parentId: user?.parentId } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-60 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ملفات أطفالي</h1>
        <p className="text-muted-foreground text-sm mt-1">تفاصيل متابعة الحالة العلاجية لأطفالك</p>
      </div>

      {(!children || children.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد أطفال مسجلون لك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map(child => {
            const colors = progressColors[child.progressLevel] || progressColors["مبتدئ"];
            const pct = progressPercent[child.progressLevel] || 20;
            return (
              <Card key={child.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/40" />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                      {child.name?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{child.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{child.age} سنوات</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">مستوى التقدم</span>
                      <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${colors.badge} ${colors.text}`}>{child.progressLevel}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className={`${colors.bar} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}% من المستهدف</p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {child.diagnosis && (
                      <div className="col-span-2 bg-muted/40 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">التشخيص</p>
                        <p className="font-semibold text-sm">{child.diagnosis}</p>
                      </div>
                    )}
                    <div className="bg-muted/40 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                        <Activity className="h-4 w-4" />
                        <p className="text-xs">الجلسات</p>
                      </div>
                      <p className="font-bold text-lg">{child.totalSessions}</p>
                    </div>
                    {child.specialistName && (
                      <div className="bg-muted/40 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                          <Stethoscope className="h-4 w-4" />
                          <p className="text-xs">الأخصائية</p>
                        </div>
                        <p className="font-semibold text-sm">{child.specialistName}</p>
                      </div>
                    )}
                  </div>

                  {child.notes && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات الأخصائية</p>
                      <p className="text-sm">{child.notes}</p>
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
