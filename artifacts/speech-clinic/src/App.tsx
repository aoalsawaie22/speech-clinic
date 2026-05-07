import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { SoundProvider } from "@/lib/sounds";
import { AppLayout } from "@/components/layout/app-layout";
import Login from "@/pages/login";

import AdminDashboard from "@/pages/admin";
import AdminSpecialists from "@/pages/admin/specialists";
import AdminChildren from "@/pages/admin/children";
import AdminAppointments from "@/pages/admin/appointments";
import AdminUsers from "@/pages/admin/users";

import SpecialistDashboard from "@/pages/specialist";
import SpecialistChildren from "@/pages/specialist/children";
import SpecialistAppointments from "@/pages/specialist/appointments";
import SpecialistExercises from "@/pages/specialist/exercises";

import ParentDashboard from "@/pages/parent";
import ParentChildren from "@/pages/parent/children";
import ParentAppointments from "@/pages/parent/appointments";

import ChildDashboard from "@/pages/child";
import ChildExercises from "@/pages/child/exercises";
import AchievementsPage from "@/pages/shared/achievements";
import SettingsPage from "@/pages/shared/settings";
import MessagesPage from "@/pages/shared/messages";

const queryClient = new QueryClient();

function RedirectToLogin() {
  const [, nav] = useLocation();
  useEffect(() => { nav("/login"); }, [nav]);
  return null;
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
    else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) setLocation("/login");
  }, [isLoading, user, allowedRoles, setLocation]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{t("common.loading")}</div>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <AppLayout><Component /></AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Admin */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} /></Route>
      <Route path="/admin/specialists"><ProtectedRoute component={AdminSpecialists} allowedRoles={["admin"]} /></Route>
      <Route path="/admin/children"><ProtectedRoute component={AdminChildren} allowedRoles={["admin"]} /></Route>
      <Route path="/admin/appointments"><ProtectedRoute component={AdminAppointments} allowedRoles={["admin"]} /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsers} allowedRoles={["admin"]} /></Route>

      {/* Specialist */}
      <Route path="/specialist"><ProtectedRoute component={SpecialistDashboard} allowedRoles={["specialist"]} /></Route>
      <Route path="/specialist/children"><ProtectedRoute component={SpecialistChildren} allowedRoles={["specialist"]} /></Route>
      <Route path="/specialist/appointments"><ProtectedRoute component={SpecialistAppointments} allowedRoles={["specialist"]} /></Route>
      <Route path="/specialist/exercises"><ProtectedRoute component={SpecialistExercises} allowedRoles={["specialist"]} /></Route>

      {/* Parent */}
      <Route path="/parent"><ProtectedRoute component={ParentDashboard} allowedRoles={["parent"]} /></Route>
      <Route path="/parent/children"><ProtectedRoute component={ParentChildren} allowedRoles={["parent"]} /></Route>
      <Route path="/parent/appointments"><ProtectedRoute component={ParentAppointments} allowedRoles={["parent"]} /></Route>

      {/* Child */}
      <Route path="/child"><ProtectedRoute component={ChildDashboard} allowedRoles={["child"]} /></Route>
      <Route path="/child/exercises"><ProtectedRoute component={ChildExercises} allowedRoles={["child"]} /></Route>
<Route path="/child/achievements">
  <ProtectedRoute component={AchievementsPage} allowedRoles={["child"]} />
</Route>
      {/* Shared */}
      <Route path="/messages"><ProtectedRoute component={MessagesPage} allowedRoles={["admin", "specialist", "parent"]} /></Route>
      <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>

      <Route path="/" component={RedirectToLogin} />
      <Route><div className="p-12 text-center text-muted-foreground">404</div></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <SoundProvider>
            <TooltipProvider>
              <AuthProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
              </AuthProvider>
              <Toaster />
            </TooltipProvider>
          </SoundProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
