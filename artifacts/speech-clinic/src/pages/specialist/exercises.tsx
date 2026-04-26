import { useState } from "react";
import { useListExercises } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Plus, Search } from "lucide-react";

const difficultyConfig: Record<string, { label: string; className: string }> = {
  سهل: { label: "سهل", className: "bg-green-100 text-green-700" },
  متوسط: { label: "متوسط", className: "bg-amber-100 text-amber-700" },
  صعب: { label: "صعب", className: "bg-red-100 text-red-700" },
};

const categoryEmojis: Record<string, string> = {
  "نطق": "🗣️",
  "تنفس": "💨",
  "تقوية": "💪",
  "استماع": "👂",
  "إيقاع": "🎵",
  "مفردات": "📚",
};

export default function SpecialistExercises() {
  const { data: exercises, isLoading } = useListExercises();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [localExercises, setLocalExercises] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", category: "", difficulty: "سهل", description: "",
    instructions: "", minAge: "2", maxAge: "5", emoji: ""
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalExercises(prev => [...prev, { id: Date.now(), ...form, minAge: parseInt(form.minAge), maxAge: parseInt(form.maxAge) }]);
    setForm({ title: "", category: "", difficulty: "سهل", description: "", instructions: "", minAge: "2", maxAge: "5", emoji: "" });
    setShowAdd(false);
  };

  const allExercises = [...(exercises || []), ...localExercises];
  const filtered = allExercises.filter(e =>
    e.title?.includes(search) || e.category?.includes(search) || e.description?.includes(search)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مكتبة التمارين</h1>
          <p className="text-muted-foreground text-sm mt-1">تمارين النطق واللغة للأطفال</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة تمرين
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="البحث عن تمرين..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">إضافة تمرين جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <Label>اسم التمرين</Label>
                <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: تمرين حرف السين" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>الفئة</Label>
                  <Input required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="نطق / تنفس..." />
                </div>
                <div className="space-y-1">
                  <Label>الرمز التعبيري</Label>
                  <Input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🗣️" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>مستوى الصعوبة</Label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.difficulty}
                  onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="سهل">سهل</option>
                  <option value="متوسط">متوسط</option>
                  <option value="صعب">صعب</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>أقل عمر (سنة)</Label>
                  <Input type="number" min="1" max="10" value={form.minAge} onChange={e => setForm(p => ({ ...p, minAge: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>أكبر عمر (سنة)</Label>
                  <Input type="number" min="1" max="10" value={form.maxAge} onChange={e => setForm(p => ({ ...p, maxAge: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>الوصف</Label>
                <textarea className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-16" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للتمرين..." />
              </div>
              <div className="space-y-1">
                <Label>تعليمات التنفيذ</Label>
                <textarea className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-20" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="خطوات تنفيذ التمرين..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">حفظ التمرين</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد تمارين</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exercise => {
            const diff = difficultyConfig[exercise.difficulty] || { label: exercise.difficulty, className: "bg-gray-100 text-gray-600" };
            const emoji = exercise.emoji || categoryEmojis[exercise.category] || "🎯";
            return (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{emoji}</div>
                    <div className="flex-1">
                      <CardTitle className="text-base leading-tight">{exercise.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{exercise.category}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.className}`}>{diff.label}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {exercise.description && (
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">العمر: {exercise.minAge} - {exercise.maxAge} سنوات</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
