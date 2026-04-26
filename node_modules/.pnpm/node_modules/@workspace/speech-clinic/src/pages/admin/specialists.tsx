import { useState } from "react";
import { useListSpecialists } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Plus, Search, Phone, Mail, Award, Users, Activity } from "lucide-react";

export default function AdminSpecialists() {
  const { data: specialists, isLoading } = useListSpecialists();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", specialty: "", experience: "", phone: "", email: "" });
  const [localSpecialists, setLocalSpecialists] = useState<any[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newSpec = {
      id: Date.now(),
      name: form.name,
      specialty: form.specialty,
      experience: parseInt(form.experience) || 0,
      phone: form.phone,
      email: form.email,
      activeChildren: 0,
      totalSessions: 0,
    };
    setLocalSpecialists(prev => [...prev, newSpec]);
    setForm({ name: "", specialty: "", experience: "", phone: "", email: "" });
    setShowAdd(false);
  };

  const allSpecialists = [...(specialists || []), ...localSpecialists];
  const filtered = allSpecialists.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
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
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الأخصائيون</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة فريق الأخصائيين في العيادة</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة أخصائي
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو التخصص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">إضافة أخصائي جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <Label>الاسم الكامل</Label>
                <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="د. محمد أحمد" />
              </div>
              <div className="space-y-1">
                <Label>التخصص</Label>
                <Input required value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="اضطرابات النطق واللغة" />
              </div>
              <div className="space-y-1">
                <Label>سنوات الخبرة</Label>
                <Input type="number" min="0" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} placeholder="5" />
              </div>
              <div className="space-y-1">
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="05xxxxxxxx" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="dr@clinic.com" dir="ltr" />
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
          <Stethoscope className="h-16 w-16 mx-auto mb-3 opacity-20" />
          <p className="text-lg">لا يوجد أخصائيون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(specialist => (
            <Card key={specialist.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{specialist.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">{specialist.specialty}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex justify-center mb-1"><Award className="h-4 w-4 text-amber-500" /></div>
                    <p className="text-lg font-bold">{specialist.experience}</p>
                    <p className="text-xs text-muted-foreground">سنة خبرة</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex justify-center mb-1"><Users className="h-4 w-4 text-blue-500" /></div>
                    <p className="text-lg font-bold">{specialist.activeChildren}</p>
                    <p className="text-xs text-muted-foreground">طفل</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex justify-center mb-1"><Activity className="h-4 w-4 text-green-500" /></div>
                    <p className="text-lg font-bold">{specialist.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">جلسة</p>
                  </div>
                </div>
                {specialist.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span dir="ltr">{specialist.email}</span>
                  </div>
                )}
                {specialist.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{specialist.phone}</span>
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
