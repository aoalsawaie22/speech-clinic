import { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Plus, Search, Shield, Stethoscope,
  Heart, Smile, Trash2, Loader2,
} from "lucide-react";

const roleConfig: Record<string, { label: string; icon: any; className: string }> = {
  admin:      { label: "مدير النظام", icon: Shield,      className: "bg-purple-100 text-purple-700" },
  specialist: { label: "أخصائي",      icon: Stethoscope, className: "bg-blue-100 text-blue-700"   },
  parent:     { label: "ولي أمر",     icon: Heart,       className: "bg-pink-100 text-pink-700"    },
  child:      { label: "طفل",         icon: Smile,       className: "bg-green-100 text-green-700"  },
};

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useListUsers();

  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState({ name: "", email: "", role: "parent", password: "" });
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash("err", data?.error ?? "حدث خطأ"); return; }
      await refetch();
      flash("ok", `✅ تم إنشاء حساب "${form.name}" بنجاح`);
      setForm({ name: "", email: "", role: "parent", password: "" });
      setShowAdd(false);
    } catch {
      flash("err", "تعذّر الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await fetch(`/api/users/${confirmId}`, { method: "DELETE" });
      await refetch();
      flash("ok", "✅ تم حذف المستخدم بنجاح");
      setConfirmId(null);
    } catch {
      flash("err", "تعذّر الحذف");
    } finally {
      setDeleting(false);
    }
  };

  const allUsers  = users ?? [];
  const filtered  = allUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const confirmUser = allUsers.find(u => u.id === confirmId);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toasts */}
      {okMsg  && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl">{okMsg}</div>}
      {errMsg && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-red-500   text-white font-bold px-5 py-3 rounded-xl shadow-xl">{errMsg}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة حسابات مستخدمي النظام</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setForm({ name: "", email: "", role: "parent", password: "" }); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> إضافة مستخدم
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <div key={role} className={`flex items-center gap-3 p-3 rounded-xl ${config.className}`}>
              <Icon className="h-5 w-5" />
              <div>
                <p className="font-bold text-lg">{allUsers.filter(u => u.role === role).length}</p>
                <p className="text-xs">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">إضافة مستخدم جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <Label>الاسم الكامل</Label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="اسم المستخدم"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="user@clinic.com"
                  dir="ltr"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label>الدور</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  disabled={saving}
                >
                  <option value="admin">مدير النظام</option>
                  <option value="specialist">أخصائي</option>
                  <option value="parent">ولي أمر</option>
                  <option value="child">طفل</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>كلمة المرور</Label>
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
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري...</> : "حفظ"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)} disabled={saving}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold">تأكيد الحذف</h2>
            <p className="text-muted-foreground text-sm">
              هل تريد حذف المستخدم{" "}
              <span className="font-bold text-foreground">"{confirmUser?.name}"</span>؟
              <br />لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري الحذف...</>
                  : <><Trash2 className="h-4 w-4 me-2" />نعم، احذف</>
                }
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmId(null)}
                disabled={deleting}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد مستخدمون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(user => {
            const config = roleConfig[user.role] || roleConfig.parent;
            const Icon = config.icon;
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.className}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmId(user.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="حذف المستخدم"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.className}`}>
                    {config.label}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}