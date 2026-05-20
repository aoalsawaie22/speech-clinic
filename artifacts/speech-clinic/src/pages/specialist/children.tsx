import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, Calendar, Activity, FileText, ChevronDown, ChevronUp } from "lucide-react";

const progressColors: Record<string, { bar: string; badge: string }> = {
  متقدم: { bar: "bg-green-500", badge: "bg-green-100 text-green-700" },
  متوسط: { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  مبتدئ: { bar: "bg-blue-500",  badge: "bg-blue-100 text-blue-700"  },
};
const progressPercent: Record<string, number> = { متقدم: 80, متوسط: 50, مبتدئ: 20 };

type Child = {
  id: number;
  name: string;
  age: number;
  gender: string;
  diagnosis: string | null;
  notes: string | null;
  progressLevel: string;
  totalSessions: number;
  specialistId: number | null;
};

export default function SpecialistChildren() {
  const { user } = useAuth();

  const [children, setChildren]   = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.specialistId) {
      setIsLoading(false);
      setChildren([]);
      return;
    }

    setIsLoading(true);
    fetch(`/api/children?specialistId=${user.specialistId}`)
      .then(r => r.json())
      .then((data: Child[]) => {
        // فلتر اضافي للتاكد ان الاطفال تبعو هاد الاخصائي بس
        const mine = Array.isArray(data)
          ? data.filter(c => c.specialistId === user.specialistId)
          : [];
        setChildren(mine);
      })
      .catch(() => setChildren([]))
      .finally(() => setIsLoading(false));
  }, [user?.specialistId]);

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">اطفالي</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {"الاطفال المعينون لك للمتابعة العلاجية"}
          {children.length > 0 && (
            <span className="ms-2 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {children.length}
              {" طفل"}
            </span>
          )}
        </p>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Smile className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد اطفال معينون لك حالياً</p>
          <p className="text-sm mt-1">سيظهر هنا الاطفال الذين يعيّنهم المدير لك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map(child => {
            const colors = progressColors[child.progressLevel] ?? { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-600" };
            const pct    = progressPercent[child.progressLevel] ?? 20;
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {child.age}
                          {" سنوات - "}
                          {child.gender === "male" ? "ذكر" : "انثى"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                      {child.progressLevel}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>مستوى التقدم</span>
                      <span>{pct}{"%"}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={colors.bar + " h-2.5 rounded-full transition-all"}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {child.diagnosis && (
                    <div className="bg-muted/40 rounded-lg p-2 text-sm">
                      <span className="text-muted-foreground">{"التشخيص: "}</span>
                      <span className="font-medium">{child.diagnosis}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                      <Activity className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">الجلسات</p>
                        <p className="font-bold text-sm">{child.totalSessions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">العمر</p>
                        <p className="font-bold text-sm">{child.age}{" سنة"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes expandable */}
                  {child.notes && (
                    <div>
                      <button
                        className="flex items-center gap-1 text-xs text-primary font-medium w-full"
                        onClick={() => setExpandedId(isExpanded ? null : child.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {"الملاحظات"}
                        {isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 ms-auto" />
                          : <ChevronDown className="h-3.5 w-3.5 ms-auto" />
                        }
                      </button>
                      {isExpanded && (
                        <div className="mt-2 bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm text-muted-foreground">
                          {child.notes}
                        </div>
                      )}
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