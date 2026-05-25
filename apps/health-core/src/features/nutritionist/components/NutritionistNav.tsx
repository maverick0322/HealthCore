import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  User
} from "lucide-react";
import logoIcon from "@/assets/icon-192.png";

const NAV_ITEMS = [
  { id: "nav-dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard/nutritionist" },
  { id: "nav-patients", labelKey: "nav.patients", icon: <Users size={20} />, path: "/patients/nutritionist" },
  { id: "nav-agenda", labelKey: "nav.agenda", icon: <CalendarDays size={20} />, path: "/agenda/nutritionist" },
  { id: "nav-reports", labelKey: "nav.reports", icon: <BarChart3 size={20} />, path: "/reports/nutritionist" },
  { id: "nav-profile", labelKey: "nav.profile", icon: <User size={20} />, path: "/profile/nutritionist" },
];

export const NutritionistNav = () => {
  const { t } = useTranslation("nutritionist");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 fixed inset-y-0 left-0 bg-card border-r border-border z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <img src={logoIcon} alt="HealthCore" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground" />
            <span className="font-bold tracking-tight text-black dark:text-white">HealthCore</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                (pathname === item.path || pathname.startsWith(item.path + "/"))
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={(pathname === item.path || pathname.startsWith(item.path + "/")) ? "text-primary" : ""}>{item.icon}</span>
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE BOTTOM BAR ── */}
      <nav
        id="bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border flex justify-around items-center py-2 px-2 z-50"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`${item.id}-mobile`}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              (pathname === item.path || pathname.startsWith(item.path + "/")) ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={(pathname === item.path || pathname.startsWith(item.path + "/")) ? "text-primary" : ""}>{item.icon}</span>
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
