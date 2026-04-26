import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSounds } from "@/lib/sounds";
import { LogIn, Globe, Sun, Moon, Volume2, VolumeX, Sparkles } from "lucide-react";

const accounts = [
  { role: "admin", email: "admin@clinic.com", password: "admin123", name: "المدير", emoji: "👨‍💼", color: "from-blue-500 to-cyan-500" },
  { role: "specialist", email: "dr.sara@clinic.com", password: "specialist123", name: "د. سارة", emoji: "👩‍⚕️", color: "from-purple-500 to-pink-500" },
  { role: "parent", email: "parent@clinic.com", password: "parent123", name: "ولي الأمر", emoji: "👨‍👩‍👧", color: "from-emerald-500 to-teal-500" },
  { role: "child", email: "child@clinic.com", password: "child123", name: "الطفل", emoji: "🧒", color: "from-amber-400 to-orange-500" },
];

export default function Login() {
  const [email, setEmail] = useState("admin@clinic.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { enabled, setEnabled, play } = useSounds();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        play("error");
        toast({ title: t("login.errorTitle"), description: t("login.error"), variant: "destructive" });
        return;
      }
      const { user } = await r.json();
      play("success");
      login({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialistId: user.specialistId ?? undefined,
        parentId: user.parentId ?? undefined,
        childId: user.childId ?? undefined,
      });
      setTimeout(() => setLocation(`/${user.role}`), 200);
    } catch {
      play("error");
      toast({ title: t("login.errorTitle"), description: t("login.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const setDemo = (acc: typeof accounts[number]) => {
    play("click");
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-aurora p-4 relative overflow-hidden">
      {/* floating bubbles */}
      <div className="absolute top-10 start-10 w-32 h-32 bg-white/30 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 end-16 w-48 h-48 bg-yellow-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 end-1/4 w-24 h-24 bg-pink-200/30 rounded-full blur-2xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Top toolbar */}
      <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
        <Button variant="secondary" size="icon" className="rounded-full backdrop-blur bg-white/70 hover:bg-white" onClick={() => { setLang(lang === "ar" ? "en" : "ar"); play("pop"); }}>
          <Globe className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full backdrop-blur bg-white/70 hover:bg-white" onClick={() => { setTheme(theme === "light" ? "dark" : "light"); play("click"); }}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full backdrop-blur bg-white/70 hover:bg-white" onClick={() => setEnabled(!enabled)}>
          {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 relative z-10">
        {/* Brand panel */}
        <div className="hidden md:flex flex-col justify-center text-white p-8">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/20 backdrop-blur rounded-full px-4 py-2 w-fit">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">{lang === "ar" ? "نظام متكامل" : "All-in-one"}</span>
          </div>
          <h1 className="text-5xl font-black mb-3 drop-shadow">{t("brand.name")}</h1>
          <p className="text-xl text-white/90 mb-8">{t("brand.tagline")}</p>
          <div className="space-y-3">
            {[
              { icon: "🎯", t: lang === "ar" ? "تمارين تفاعلية للأطفال" : "Interactive exercises for kids" },
              { icon: "🎮", t: lang === "ar" ? "ألعاب علاجية ممتعة" : "Fun therapeutic games" },
              { icon: "📅", t: lang === "ar" ? "إدارة المواعيد والجلسات" : "Appointments & sessions management" },
              { icon: "💬", t: lang === "ar" ? "تواصل مباشر بين الأخصائيين والأهل" : "Direct communication" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl p-3">
                <div className="text-2xl">{f.icon}</div>
                <p className="text-white/95 font-medium">{f.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-card/95 animate-pop-in">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-3 animate-glow">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{t("login.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("brand.tagline")}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className="h-11" />
              </div>
              <Button type="submit" className="w-full text-base h-12 gradient-primary text-white font-bold shadow-lg">
                <LogIn className="me-2 h-4 w-4" /> {t("login.submit")}
              </Button>
            </form>

            <div className="mt-6 border-t pt-5">
              <p className="text-xs text-center text-muted-foreground mb-3 uppercase tracking-wider">{t("login.demo")}</p>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map(a => (
                  <button
                    key={a.role}
                    type="button"
                    onClick={() => setDemo(a)}
                    className={`group relative overflow-hidden rounded-xl p-3 text-white text-sm font-bold bg-gradient-to-br ${a.color} hover:scale-[1.03] transition-all shadow-md`}
                  >
                    <div className="text-2xl mb-1">{a.emoji}</div>
                    <div>{t(`role.${a.role}`)}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
