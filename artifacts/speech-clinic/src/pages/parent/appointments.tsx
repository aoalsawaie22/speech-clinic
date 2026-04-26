import { useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const statusMap: Record<string, { label: string; icon: any; className: string }> = {
  scheduled: { label: "مجدول", icon: AlertCircle, className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "مكتمل", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "ملغى", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
};

export default function ParentAppointments() {
  const { data: appointments, isLoading } = useListAppointments();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-44" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  const upcoming = appointments?.filter(a => a.status === "scheduled") || [];
  const past = appointments?.filter(a => a.status !== "scheduled") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">مواعيد الجلسات</h1>
        <p className="text-muted-foreground text-sm mt-1">سجل مواعيدك العلاجية القادمة والسابقة</p>
      </div>

      {(!appointments || appointments.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد مواعيد حالياً</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">المواعيد القادمة</h2>
              {upcoming.map(appointment => (
                <Card key={appointment.id} className="border-r-4 border-r-blue-400 hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold">{appointment.childName}</h3>
                        <p className="text-sm text-muted-foreground">د. {appointment.specialistName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-semibold text-sm">{new Date(appointment.date).toLocaleDateString('ar-EG')}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusMap[appointment.status]?.className}`}>
                        {statusMap[appointment.status]?.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">المواعيد السابقة</h2>
              {past.map(appointment => {
                const status = statusMap[appointment.status] || statusMap.completed;
                return (
                  <Card key={appointment.id} className="opacity-70 hover:opacity-100 transition-opacity">
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold">{appointment.childName}</h3>
                          <p className="text-sm text-muted-foreground">د. {appointment.specialistName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">{new Date(appointment.date).toLocaleDateString('ar-EG')}</p>
                          <p className="text-xs text-muted-foreground">{appointment.time}</p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
