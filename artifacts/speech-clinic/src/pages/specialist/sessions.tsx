import { useState } from "react";
import { useListSessions, useListChildren } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Star, FileText, Activity } from "lucide-react";

export default function SpecialistSessions() {
  const { user } = useAuth();
  const { data: sessions, isLoading } = useListSessions({ query: { specialistId: user?.specialistId } });
  const { data: children } = useListChildren({ query: { specialistId: user?.specialistId } });
  const [showAdd, setShowAdd] = useState(false);
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ childId: "", date: "", duration: "", score: "", notes: "", goals: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const child = children?.find(c => c.id === parseInt(form.childId));
    const newSession = {
      id: Date.now(),
      childName: child?.name || "طفل",
      date: form.date,
      duration: parseInt(form.duration) || 45,
      score: parseInt(form.score) || 7,
      notes: form.notes,
      goals: form.goals,
    };
    setLocalSessions(prev => [...prev, newSession]);
    setForm({ childId: "", date: "", duration: "", score: "", notes: "", goals: "" });
    setShowAdd(false);
  };

  const allSessions = [...(sessions || []), ...localSessions];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل الجلسات</h1>
          <p className="text-muted-foreground text-sm mt-1">جميع الجلسات العلاجية المسجلة</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          تسجيل جلسة جديدة
        </Button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">تسجيل جلسة جديدة</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>التاريخ</Label>
                  <Input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>المدة (دقيقة)</Label>
                  <Input type="number" min="10" max="120" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="45" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>تقييم الجلسة (من 10)</Label>
                <Input type="number" min="1" max="10" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} placeholder="7" />
              </div>
              <div className="space-y-1">
                <Label>أهداف الجلسة</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-16"
                  value={form.goals}
                  onChange={e => setForm(p => ({ ...p, goals: e.target.value }))}
                  placeholder="الأهداف المحددة للجلسة..."
                />
              </div>
              <div className="space-y-1">
                <Label>ملاحظات الأخصائي</Label>
                <textarea
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none h-20"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="الملاحظات السريرية والتقدم المحرز..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">حفظ الجلسة</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {allSessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا توجد جلسات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allSessions.map(session => (
            <Card key={session.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                      {session.childName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{session.childName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration} دقيقة
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-700">{session.score}/10</span>
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
