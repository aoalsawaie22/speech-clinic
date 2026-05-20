import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Plus, Search, Clock,
  Trash2, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

const statusMap: Record<string, { label: string; className: string }> = {
  scheduled: { label: "مجدول",  className: "bg-blue-100 text-blue-700 border-blue-200"   },
  completed: { label: "مكتمل",  className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "ملغى",   className: "bg-red-100 text-red-700 border-red-200"       },
  no_show:   { label: "غياب",   className: "bg-gray-100 text-gray-600 border-gray-200"    },
};

const EMPTY = { childId: "", specialistId: "", date: "", time: "", duration: "60", notes: "" };

type Child       = { id: number; name: string; age: number; specialistId: number | null };
type Specialist  = { id: number; name: string; specialty: string };
type Appointment = {
  id: number; childId: number; childName: string;
  specialistId: number; specialistName: string;
  date: string; time: string; duration: number; status: string;
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren]         = useState<Child[]>([]);
  const [specialists, setSpecialists]   = useState<Specialist[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  const [showAdd, setShowAdd]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm]                 = useState(EMPTY);
  const [confirmId, setConfirmId]       = useState<number | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [okMsg, setOkMsg]               = useState("");
  const [errMsg, setErrMsg]             = useState("");

  const flash = (type: "ok" | "err", msg: string) => {
    if (type === "ok") { setOkMsg(msg);  setTimeout(() => setOkMsg(""),  3000); }
    else               { setErrMsg(msg); setTimeout(() => setErrMsg(""), 3500); }
  };

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [apptRes, childRes, specRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/children"),
        fetch("/api/specialists"),
      ]);
      setAppointments(await apptRes.json());
      setChildren(await childRes.json());
      setSpecialists(await specRes.json());
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // لما تختار طفل — اعبي الاخصائي تلقائياً
  const handleChildChange = (childId: string) => {
    const child = children.find(c => c.id === parseInt(childId));
    setForm(p => ({
      ...p,
      childId,
      specialistId: child?.specialistId ? String(child.specialistId) : p.specialistId,
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId:      parseInt(form.childId),
          specialistId: parseInt(form.specialistId),
          date:         form.date,
          time:         form.time,
          duration:     parseInt(form.duration) || 60,
          notes:        form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash("err", data?.error ?? "حدث خطا"); return; }
      await loadAll();
      flash("ok", "تم اضافة الموعد بنجاح");
      setForm(EMPTY);
      setShowAdd(false);
    } catch {
      flash("err", "تعذر الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await fetch(`/api/appointments/${confirmId}`, { method: "DELETE" });
      await loadAll();
      flash("ok", "تم حذف الموعد");
      setConfirmId(null);
    } catch {
      flash("err", "تعذر الحذف");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch { /* silent */ }
  };

  const allAppts = Array.isArray(appointments) ? appointments : [];
  const filtered = allAppts.filter(a => {
    const matchSearch = a.childName?.includes(search) || a.specialistName?.includes(search);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const confirmAppt = allAppts.find(a => a.id === confirmId);

  // الطفل المختار — لمعرفة اسم الاخصائي المعين
  const selectedChild = children.find(c => c.id === parseInt(form.childId));
  const autoSpecialist = specialists.find(s => s.id === selectedChild?.specialistId);

  if (isLoading) return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-40" /><Skeleton className="h-10 w-36" />
      </div>
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">

      {okMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />{okMsg}
        </div>
      )}
      {errMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />{errMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المواعيد</h1>
          <p className="text-muted-foreground text-sm mt-1">ادارة مواعيد الجلسات العلاجية</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setForm(EMPTY); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          اضافة موعد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-700">{allAppts.filter(a => a.status === "scheduled").length}</p>
          <p className="text-xs text-blue-600">قادمة</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-700">{allAppts.filter(a => a.status === "completed").length}</p>
          <p className="text-xs text-green-600">مكتملة</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-red-700">{allAppts.filter(a => a.status === "cancelled").length}</p>
          <p className="text-xs text-red-600">ملغاة</p>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 my-4">
            <h2 className="text-xl font-bold">اضافة موعد جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">

              {/* اختيار الطفل */}
              <div className="space-y-1">
                <Label>{"الطفل *"}</Label>
                <select
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.childId}
                  onChange={e => handleChildChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="">{"اختر الطفل"}</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {" ("}
                      {c.age}
                      {" سنوات)"}
                      {c.specialistId ? " ✓" : ""}
                    </option>
                  ))}
                </select>

                {/* تلميح اوتوماتيك للاخصائي */}
                {autoSpecialist && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {"تم تعيين "}
                    <span className="font-bold">{autoSpecialist.name}</span>
                    {" تلقائياً"}
                  </div>
                )}
              </div>

              {/* الاخصائي — يتعبأ تلقائياً او يختار يدوياً */}
              <div className="space-y-1">
                <Label>{"الاخصائي *"}</Label>
                <select
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.specialistId}
                  onChange={e => setForm(p => ({ ...p, specialistId: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">{"اختر الاخصائي"}</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {" - "}
                      {s.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* التاريخ + الوقت */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{"التاريخ *"}</Label>
                  <Input
                    type="date" required
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{"الوقت *"}</Label>
                  <Input
                    type="time" required
                    value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* مدة الجلسة */}
              <div className="space-y-1">
                <Label>مدة الجلسة</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.duration}
                  onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                  disabled={saving}
                >
                  <option value="30">30 دقيقة</option>
                  <option value="45">45 دقيقة</option>
                  <option value="60">60 دقيقة</option>
                  <option value="90">90 دقيقة</option>
                </select>
              </div>

              {/* ملاحظات */}
              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-16"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="اي ملاحظات..."
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin me-2" />{"جاري الحفظ..."}</>
                  ) : (
                    "حفظ الموعد"
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)} disabled={saving}>
                  الغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold">تاكيد الحذف</h2>
            <p className="text-muted-foreground text-sm">
              {"هل تريد حذف موعد "}
              <span className="font-bold text-foreground">{confirmAppt?.childName}</span>
              {" بتاريخ "}
              <span className="font-bold">{confirmAppt?.date}</span>
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Trash2 className="h-4 w-4 me-2" />}
                احذف
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)} disabled={deleting}>الغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد مواعيد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex flex-wrap justify-between items-center p-5 gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">{a.childName}</h3>
                    <p className="text-sm text-muted-foreground">{a.specialistName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{a.date}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{a.time}
                    </p>
                  </div>
                  <select
                    className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer ${statusMap[a.status]?.className ?? "bg-gray-100 text-gray-600"}`}
                    value={a.status}
                    onChange={e => handleStatusChange(a.id, e.target.value)}
                  >
                    <option value="scheduled">مجدول</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغى</option>
                    <option value="no_show">غياب</option>
                  </select>
                  <button
                    onClick={() => setConfirmId(a.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}