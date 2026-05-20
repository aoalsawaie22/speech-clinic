import { useState, useEffect } from "react";
import { useListChildren, useListSpecialists } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smile, Plus, Search, Calendar,
  Trash2, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

const diagnosisOptions = [
  "تاخر في الكلام",
  "اضطراب النطق",
  "التاتاة",
  "ضعف السمع",
  "التوحد",
  "اضطراب اللغة التعبيرية",
  "اخرى",
];

const progressColors: Record<string, string> = {
  متقدم: "bg-green-100 text-green-700 border-green-200",
  متوسط: "bg-amber-100 text-amber-700 border-amber-200",
  مبتدئ: "bg-blue-100 text-blue-700 border-blue-200",
};

const EMPTY = {
  name: "", age: "", gender: "male",
  email: "", password: "",
  parentId: "", specialistId: "",
  diagnosis: "", notes: "",
};

type ParentUser = { id: number; name: string; email: string };

export default function AdminChildren() {
  const { data: children, isLoading, refetch } = useListChildren();
  const { data: specialists } = useListSpecialists();

  const [showAdd, setShowAdd]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [form, setForm]             = useState(EMPTY);
  const [confirmId, setConfirmId]   = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [okMsg, setOkMsg]           = useState("");
  const [errMsg, setErrMsg]         = useState("");
  const [parentUsers, setParentUsers] = useState<ParentUser[]>([]);

  // جلب اولياء الامور فقط لما تفتح نافذة الاضافة
  useEffect(() => {
    if (!showAdd) return;
    fetch("/api/users")
      .then(r => r.json())
      .then((users: any[]) => {
        setParentUsers(users.filter(u => u.role === "parent"));
      })
      .catch(() => setParentUsers([]));
  }, [showAdd]);

  const flash = (type: "ok" | "err", msg: string) => {
    if (type === "ok") { setOkMsg(msg);  setTimeout(() => setOkMsg(""),  3000); }
    else               { setErrMsg(msg); setTimeout(() => setErrMsg(""), 3500); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentId) { flash("err", "يجب اختيار ولي الامر"); return; }
    setSaving(true);
    try {
      // الخطوة 1: انشاء حساب المستخدم للطفل
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
          role:     "child",
        }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        flash("err", userData?.error ?? "خطا في انشاء الحساب");
        return;
      }

      // الخطوة 2: انشاء سجل الطفل
      const childRes = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name,
          age:          parseInt(form.age),
          gender:       form.gender,
          parentId:     parseInt(form.parentId),
          specialistId: form.specialistId ? parseInt(form.specialistId) : null,
          diagnosis:    form.diagnosis || null,
          notes:        form.notes || null,
        }),
      });
      const childData = await childRes.json();
      if (!childRes.ok) {
        flash("err", childData?.error ?? "خطا في انشاء سجل الطفل");
        return;
      }

      await refetch();
      flash("ok", "تم اضافة الطفل " + form.name + " بنجاح");
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
      await fetch(`/api/children/${confirmId}`, { method: "DELETE" });
      await refetch();
      flash("ok", "تم حذف الطفل");
      setConfirmId(null);
    } catch {
      flash("err", "تعذر الحذف");
    } finally {
      setDeleting(false);
    }
  };

  const allChildren = children ?? [];
  const filtered = allChildren.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.diagnosis?.includes(search)
  );
  const confirmChild = allChildren.find(c => c.id === confirmId);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
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
          <h1 className="text-3xl font-bold text-gray-900">الاطفال</h1>
          <p className="text-muted-foreground text-sm mt-1">ادارة ملفات الاطفال في العيادة</p>
        </div>
        <Button
          onClick={() => { setShowAdd(true); setForm(EMPTY); }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          اضافة طفل
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم او التشخيص..."
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
              <h2 className="text-xl font-bold">اضافة طفل جديد</h2>
              <p className="text-xs text-muted-foreground mt-1">سيتم انشاء حساب تسجيل دخول للطفل تلقائياً</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">

              {/* ولي الامر */}
              <div className="space-y-1">
                <Label>{"ولي الامر *"}</Label>
                {parentUsers.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
                    لا يوجد اولياء امور — اضف مستخدماً بدور ولي امر اولاً
                  </p>
                ) : (
                  <select
                    required
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.parentId}
                    onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="">{"اختر ولي الامر"}</option>
                    {parentUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                        {" ("}
                        {u.email}
                        {")"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* اسم الطفل */}
              <div className="space-y-1">
                <Label>{"اسم الطفل *"}</Label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="محمد علي"
                  disabled={saving}
                />
              </div>

              {/* العمر + الجنس */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{"العمر (سنوات) *"}</Label>
                  <Input
                    type="number" min="1" max="18" required
                    value={form.age}
                    onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                    placeholder="5"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{"الجنس *"}</Label>
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.gender}
                    onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="male">ذكر</option>
                    <option value="female">انثى</option>
                  </select>
                </div>
              </div>

              {/* بيانات الحساب */}
              <div className="border border-dashed border-primary/30 rounded-xl p-3 space-y-3 bg-primary/5">
                <p className="text-xs font-semibold text-primary">بيانات تسجيل الدخول للطفل</p>
                <div className="space-y-1">
                  <Label>{"البريد الالكتروني *"}</Label>
                  <Input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="child@clinic.com"
                    dir="ltr"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{"كلمة المرور *"}</Label>
                  <Input
                    type="password" required minLength={6}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* الاخصائي */}
              <div className="space-y-1">
                <Label>الاخصائي المسؤول</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.specialistId}
                  onChange={e => setForm(p => ({ ...p, specialistId: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">{"بدون تعيين"}</option>
                  {(specialists ?? []).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {" - "}
                      {s.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* التشخيص */}
              <div className="space-y-1">
                <Label>التشخيص</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.diagnosis}
                  onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                  disabled={saving}
                >
                  <option value="">{"اختر التشخيص"}</option>
                  {diagnosisOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
                <Button type="submit" className="flex-1" disabled={saving || !form.parentId}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin me-2" />{"جاري الحفظ..."}</>
                  ) : (
                    "حفظ الطفل"
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
              {"هل تريد حذف ملف الطفل "}
              <span className="font-bold text-foreground">{confirmChild?.name}</span>
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

      {/* Children List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Smile className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد اطفال</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(child => (
            <Card key={child.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                      {child.name?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{child.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {child.age}
                        {" سنوات"}
                        {child.gender === "male" ? " - ذكر" : " - انثى"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${progressColors[child.progressLevel] ?? "bg-gray-100 text-gray-600"}`}>
                      {child.progressLevel}
                    </span>
                    <button
                      onClick={() => setConfirmId(child.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.diagnosis && (
                  <div className="bg-muted/40 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground">{"التشخيص: "}</span>
                    <span className="font-medium">{child.diagnosis}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>عدد الجلسات</span>
                  <span className="font-semibold text-foreground">{child.totalSessions}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: Math.min((child.totalSessions / 20) * 100, 100) + "%" }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}