import { useState } from "react";
import { useListAppointments, useListSpecialists, useListChildren } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Search, Clock, Filter } from "lucide-react";

const statusMap: Record<string, { label: string; className: string }> = {
  scheduled: { label: "مجدول", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "مكتمل", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "ملغى", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function AdminAppointments() {
  const { data: appointments, isLoading } = useListAppointments();
  const { data: specialists } = useListSpecialists();
  const { data: children } = useListChildren();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);
  const [form, setForm] = useState({ childId: "", specialistId: "", date: "", time: "", notes: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const child = children?.find(c => c.id === parseInt(form.childId));
    const specialist = specialists?.find(s => s.id === parseInt(form.specialistId));
    const newAppt = {
      id: Date.now(),
      childName: child?.name || "طفل",
      specialistName: specialist?.name || "أخصائي",
      date: form.date,
      time: form.time,
      status: "scheduled",
      notes: form.notes,
    };
    setLocalAppointments(prev => [...prev, newAppt]);
    setForm({ childId: "", specialistId: "", date: "", time: "", notes: "" });
    setShowAdd(false);
  };

  const allAppointments = [...(appointments || []), ...localAppointments];
  const filtered = allAppointments.filter(a => {
    const matchSearch = a.childName?.includes(search) || a.specialistName?.includes(search);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المواعيد</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة مواعيد الجلسات العلاجية</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة موعد
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="البحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <select
          className="border border-input rounded-md px-3 py-2 text-sm bg-background"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">جميع الحالات</option>
          <option value="scheduled">مجدول</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">إضافة موعد جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <Label>الطفل</Label>
                <select
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.childId}
                  onChange={e => setForm(p => ({ ...p, childId: e.target.value }))}
                >
                  <option value="">اختر الطفل</option>
                  {children?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>الأخصائي</Label>
                <select
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.specialistId}
                  onChange={e => setForm(p => ({ ...p, specialistId: e.target.value }))}
                >
                  <option value="">اختر الأخصائي</option>
                  {specialists?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>التاريخ</Label>
                  <Input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>الوقت</Label>
                  <Input type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-16"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="أي ملاحظات..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">حفظ</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد مواعيد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appointment => (
            <Card key={appointment.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex justify-between items-center p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">{appointment.childName}</h3>
                    <p className="text-sm text-muted-foreground">د. {appointment.specialistName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="font-semibold text-sm">{new Date(appointment.date).toLocaleDateString('ar-EG')}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {appointment.time}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusMap[appointment.status]?.className || "bg-gray-100 text-gray-600"}`}>
                    {statusMap[appointment.status]?.label || appointment.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
