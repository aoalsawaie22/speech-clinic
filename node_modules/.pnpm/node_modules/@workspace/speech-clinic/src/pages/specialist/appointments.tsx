import { useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";

const statusMap: Record<string, { label: string; className: string }> = {
  scheduled: { label: "مجدول", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "مكتمل", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "ملغى", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function SpecialistAppointments() {
  const { user } = useAuth();
  const { data: appointments, isLoading } = useListAppointments({ query: { specialistId: user?.specialistId } });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  const upcoming = appointments?.filter(a => a.status === "scheduled") || [];
  const past = appointments?.filter(a => a.status !== "scheduled") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">مواعيدي</h1>
        <p className="text-muted-foreground text-sm mt-1">جدول المواعيد والجلسات القادمة</p>
      </div>

      {(!appointments || appointments.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد مواعيد</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                المواعيد القادمة
              </h2>
              {upcoming.map(appointment => (
                <Card key={appointment.id} className="border-r-4 border-r-blue-400 hover:shadow-sm transition-shadow">
                  <CardContent className="flex justify-between items-center p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold">{appointment.childName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-sm">{new Date(appointment.date).toLocaleDateString('ar-EG')}</p>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusMap[appointment.status]?.className}`}>
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
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
                المواعيد السابقة
              </h2>
              {past.map(appointment => (
                <Card key={appointment.id} className="opacity-70 hover:opacity-100 transition-opacity">
                  <CardContent className="flex justify-between items-center p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold">{appointment.childName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">{new Date(appointment.date).toLocaleDateString('ar-EG')}</p>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusMap[appointment.status]?.className}`}>
                        {statusMap[appointment.status]?.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
