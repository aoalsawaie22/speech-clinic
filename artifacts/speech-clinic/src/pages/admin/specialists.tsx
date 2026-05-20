import { useState } from "react";
import { useListSpecialists } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Stethoscope, Search, Mail, Award, Users,
  Activity, Trash2, Loader2, Plus, CheckCircle2, AlertCircle,
} from "lucide-react";

const specialtyOptions = [
  "اضطرابات النطق واللغة",
  "تاخر الكلام",
  "التاتاة",
  "اضطرابات الصوت",
  "صعوبات التعلم",
  "التوحد",
  "اخرى",
];

const EMPTY = {
  name: "", email: "", password: "",
  specialty: "", experience: "", bio: "",
};

export default function AdminSpecialists() {
  const { data: specialists, isLoading, refetch } = useListSpecialists();

  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(EMPTY);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [okMsg, setOkMsg]         = useState("");
  const [errMsg, setErrMsg]       = useState("");

  const flash = (type: "ok" | "err", msg: string) => {
    if (type === "ok") { setOkMsg(msg);  setTimeout(() => setOkMsg(""),  3000); }
    else               { setErrMsg(msg); setTimeout(() => setErrMsg(""), 3500); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // الخطوة 1: انشاء حساب المستخدم
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
          role:     "specialist",
        }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        flash("err", userData?.error ?? "خطا في انشاء الحساب");
        return;
      }

      // الخطوة 2: انشاء سجل الاخصائي
      const specRes = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:     userData.id,
          specialty:  form.specialty,
          experience: form.experience ? parseInt(form.experience) : null,
          bio:        form.bio || null,
        }),
      });
      const specData = await specRes.json();
      if (!specRes.ok) {
        flash("err", specData?.error ?? "خطا في انشاء سجل الاخصائي");
        return;
      }

      await refetch();
      flash("ok", "تم اضافة الاخصائي " + form.name + " بنجاح");
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
      await fetch(`/api/specialists/${confirmId}`, { method: "DELETE" });
      await refetch();
      flash("ok", "تم حذف الاخصائي");
      setConfirmId(null);
    } catch {
      flash("err", "تعذر الحذف");
    } finally {
      setDeleting(false);
    }
  };

  const allSpecialists = specialists ?? [];
  const filtered = allSpecialists.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.specialty?.toLowerCase().includes(search.toLowerCase())
  );
  const confirmSpec = allSpecialists.find(s => s.id === confirmId);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {okMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          {okMsg}
        </div>
      )}

      {errMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الاخصائيون</h1>
          <p className="text-muted-foreground text-sm mt-1">ادارة فريق الاخصائيين في العيادة</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setForm(EMPTY); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          اضافة اخصائي
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم او التخصص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 my-4">
            <div>
              <h2 className="text-xl font-bold">اضافة اخصائي جديد</h2>
              <p className="text-xs text-muted-foreground mt-1">سيتم انشاء حساب تسجيل دخول للاخصائي تلقائياً</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">

              {/* اسم */}
              <div className="space-y-1">
                <Label>{"الاسم الكامل *"}</Label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="د. محمد احمد"
                  disabled={saving}
                />
              </div>

              {/* التخصص */}
              <div className="space-y-1">
                <Label>{"التخصص *"}</Label>
                <select
                  required
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.specialty}
                  onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">{"اختر التخصص"}</option>
                  {specialtyOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* سنوات الخبرة */}
              <div className="space-y-1">
                <Label>سنوات الخبرة</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={form.experience}
                  onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                  placeholder="5"
                  disabled={saving}
                />
              </div>

              {/* نبذة */}
              <div className="space-y-1">
                <Label>نبذة مختصرة</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-16"
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="نبذة عن الاخصائي..."
                  disabled={saving}
                />
              </div>

              {/* بيانات الحساب */}
              <div className="border border-dashed border-primary/30 rounded-xl p-3 space-y-3 bg-primary/5">
                <p className="text-xs font-semibold text-primary">بيانات تسجيل الدخول</p>
                <div className="space-y-1">
                  <Label>{"البريد الالكتروني *"}</Label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="dr@clinic.com"
                    dir="ltr"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{"كلمة المرور *"}</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin me-2" />{"جاري الحفظ..."}</>
                  ) : (
                    "حفظ الاخصائي"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdd(false)}
                  disabled={saving}
                >
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
              {"هل تريد حذف الاخصائي "}
              <span className="font-bold text-foreground">{confirmSpec?.name}</span>
              {"؟"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Trash2 className="h-4 w-4 me-2" />
                )}
                احذف
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmId(null)}
                disabled={deleting}
              >
                الغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد اخصائيون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">{s.specialty}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmId(s.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <Award className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.experience ?? 0}</p>
                    <p className="text-xs text-muted-foreground">سنة خبرة</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.activeChildren}</p>
                    <p className="text-xs text-muted-foreground">طفل</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <Activity className="h-4 w-4 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{s.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">جلسة</p>
                  </div>
                </div>
                {s.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span dir="ltr">{s.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}