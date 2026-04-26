import { useState } from "react";
import { useListChildren } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smile, Plus, Search, Calendar } from "lucide-react";

const progressColors: Record<string, string> = {
  متقدم: "bg-green-100 text-green-700 border-green-200",
  متوسط: "bg-amber-100 text-amber-700 border-amber-200",
  مبتدئ: "bg-blue-100 text-blue-700 border-blue-200",
};

const diagnosisOptions = [
  "تأخر في الكلام",
  "اضطراب النطق",
  "التأتأة",
  "ضعف السمع",
  "التوحد",
  "اضطراب اللغة التعبيرية",
  "أخرى",
];

export default function AdminChildren() {
  const { data: children, isLoading } = useListChildren();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [localChildren, setLocalChildren] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", age: "", diagnosis: "", notes: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newChild = {
      id: Date.now(),
      name: form.name,
      age: parseInt(form.age) || 0,
      diagnosis: form.diagnosis,
      notes: form.notes,
      progressLevel: "مبتدئ",
      totalSessions: 0,
    };
    setLocalChildren(prev => [...prev, newChild]);
    setForm({ name: "", age: "", diagnosis: "", notes: "" });
    setShowAdd(false);
  };

  const allChildren = [...(children || []), ...localChildren];
  const filtered = allChildren.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.diagnosis?.includes(search)
  );

  if (isLoading) {
    return (
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
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الأطفال</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة ملفات الأطفال في العيادة</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة طفل
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو التشخيص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">إضافة طفل جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <Label>اسم الطفل</Label>
                <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="محمد علي" />
              </div>
              <div className="space-y-1">
                <Label>العمر (بالسنوات)</Label>
                <Input type="number" min="1" max="10" required value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="3" />
              </div>
              <div className="space-y-1">
                <Label>التشخيص</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.diagnosis}
                  onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                >
                  <option value="">اختر التشخيص</option>
                  {diagnosisOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>ملاحظات</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-20"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية..."
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
          <Smile className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد أطفال</p>
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
                        {child.age} سنوات
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${progressColors[child.progressLevel] || "bg-gray-100 text-gray-600"}`}>
                    {child.progressLevel}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.diagnosis && (
                  <div className="bg-muted/40 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground">التشخيص: </span>
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
                    style={{ width: `${Math.min((child.totalSessions / 20) * 100, 100)}%` }}
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
