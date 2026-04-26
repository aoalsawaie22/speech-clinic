import { useListSessions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, Star, FileText } from "lucide-react";

export default function ParentSessions() {
  const { data: sessions, isLoading } = useListSessions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-44" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">سجل الجلسات</h1>
        <p className="text-muted-foreground text-sm mt-1">تاريخ جلسات العلاج لأطفالك</p>
      </div>

      {(!sessions || sessions.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد جلسات مسجلة بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card key={session.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                      {session.childName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold">{session.childName}</h3>
                      <p className="text-sm text-muted-foreground">د. {session.specialistName}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration} دقيقة
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5 bg-muted/30 rounded-lg p-2">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 shrink-0">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-700 text-sm">{session.score}/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
