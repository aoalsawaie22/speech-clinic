import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSounds } from "@/lib/sounds";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Settings as SettingsIcon, Globe, Sun, Moon, Volume2, User, Languages } from "lucide-react";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { enabled, setEnabled, play } = useSounds();
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.preferences")}
        icon={<SettingsIcon className="h-7 w-7" />}
        gradient="purple"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              {t("settings.language")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={lang === "ar" ? "default" : "outline"}
              className="w-full justify-start text-base h-12"
              onClick={() => { setLang("ar"); play("pop"); }}
            >
              🇸🇦 العربية
              {lang === "ar" && <span className="ms-auto">✓</span>}
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              className="w-full justify-start text-base h-12"
              onClick={() => { setLang("en"); play("pop"); }}
            >
              🇺🇸 English
              {lang === "en" && <span className="ms-auto">✓</span>}
            </Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-secondary" />
              {t("settings.theme")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="w-full justify-start text-base h-12"
              onClick={() => { setTheme("light"); play("click"); }}
            >
              <Sun className="me-2 h-4 w-4" /> {t("settings.themeLight")}
              {theme === "light" && <span className="ms-auto">✓</span>}
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="w-full justify-start text-base h-12"
              onClick={() => { setTheme("dark"); play("click"); }}
            >
              <Moon className="me-2 h-4 w-4" /> {t("settings.themeDark")}
              {theme === "dark" && <span className="ms-auto">✓</span>}
            </Button>
          </CardContent>
        </Card>

        {/* Sound */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-emerald-500" />
              {t("settings.sound")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
              <Label htmlFor="sound-toggle" className="text-base cursor-pointer">
                {enabled ? t("settings.soundOn") : t("settings.soundOff")}
              </Label>
              <Switch
                id="sound-toggle"
                checked={enabled}
                onCheckedChange={(c) => { setEnabled(c); if (c) play("success"); }}
              />
            </div>
            <Button variant="outline" className="w-full mt-3" onClick={() => play("achievement")} disabled={!enabled}>
              🔊 اختبار الأصوات / Test Sounds
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              {t("settings.account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("login.email")}</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <p className="font-medium capitalize">{user?.role && t(`role.${user.role}`)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
