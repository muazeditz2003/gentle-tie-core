import { useEffect } from "react";
import { Home, Search, Siren, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  const profilePath = !user
    ? "/login"
    : role === "worker"
      ? "/worker-dashboard"
      : role === "admin"
        ? "/admin"
        : "/dashboard";

  const items = [
    { label: "Home", to: "/", icon: Home },
    { label: "Search", to: "/discover", icon: Search },
    { label: "Requests", to: "/blood-donors", icon: Siren, urgent: true },
    { label: "Messages", to: "/messages", icon: MessageSquare },
    { label: "Profile", to: profilePath, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-md rounded-2xl border border-border/70 bg-card/95 backdrop-blur-xl shadow-premium px-2 py-2">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));

          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={`tap-feedback flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : item.urgent
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${item.urgent && !active ? "text-destructive" : ""}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;