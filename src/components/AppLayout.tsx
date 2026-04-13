import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Compass, HeartPulse, Home, MessageSquare, Search, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import logoImg from "@/assets/logo.png";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const AppLayout = ({ title, subtitle, action, children }: AppLayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();

  const profilePath = role === "worker" ? "/worker-dashboard" : role === "admin" ? "/admin" : "/dashboard";

  const navItems = [
    { label: "Home", to: "/", icon: Home },
    { label: "Explore", to: "/discover", icon: Compass },
    { label: "Requests", to: "/blood-donors", icon: HeartPulse, emphasis: true },
    { label: "Messages", to: "/messages", icon: MessageSquare },
    { label: "Profile", to: profilePath, icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="md:hidden sticky top-0 z-40 border-b bg-card/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="NearKonnect" className="h-8 object-contain" loading="lazy" />
          </Link>
          <NotificationBell />
        </div>
      </header>

      <div className="mx-auto hidden max-w-[1200px] md:flex md:gap-6 md:px-4 md:py-6">
        <aside className="sticky top-6 h-[calc(100vh-3rem)] w-64 rounded-3xl border bg-card p-4 shadow-premium">
          <Link to="/" className="mb-5 flex items-center gap-2 px-2">
            <img src={logoImg} alt="NearKonnect" className="h-9 object-contain" loading="lazy" />
          </Link>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-primary/12 text-primary"
                      : item.emphasis
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-6 z-30 mb-5 flex items-center gap-3 rounded-3xl border bg-card/95 p-3 backdrop-blur-xl shadow-premium">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                readOnly
                onClick={() => navigate("/discover")}
                placeholder="Find help near you..."
                className="h-11 rounded-2xl border-none bg-muted pl-10"
              />
            </div>
            <NotificationBell />
            <Button variant="outline" className="rounded-2xl">
              <Bell className="h-4 w-4" />
              <span className="hidden lg:inline">Activity</span>
            </Button>
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name?.split(" ")[0] || "You"}
            </div>
          </div>

          <main className="rounded-3xl border bg-card p-6 shadow-premium">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {action}
            </div>
            {children}
          </main>
        </div>
      </div>

      <main className="px-4 pb-32 pt-4 md:hidden">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;