import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  User
} from "lucide-react";

const NAV_ITEMS = [
  { id: "nav-dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard/nutritionist" },
  { id: "nav-patients", labelKey: "nav.patients", icon: <Users size={20} />, path: "/patients/nutritionist" },
  { id: "nav-agenda", labelKey: "nav.agenda", icon: <CalendarDays size={20} />, path: "/agenda/nutritionist" },
  { id: "nav-reports", labelKey: "nav.reports", icon: <BarChart3 size={20} />, path: "/reports/nutritionist" },
  { id: "nav-profile", labelKey: "nav.profile", icon: <User size={20} />, path: "/profile/nutritionist" },
];

export const NutritionistNav = () => {
  const { t } = useTranslation("nutritionist");
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 fixed inset-y-0 left-0 bg-card border-r border-border z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              N
            </div>
            NutriTrack
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE BOTTOM BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
                  ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                `}
              >
                <div className={`p-1.5 rounded-full transition-all duration-200 ${isActive ? "bg-primary/10" : ""}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
