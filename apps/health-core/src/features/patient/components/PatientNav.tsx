import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, UtensilsCrossed, History, User, Leaf } from "lucide-react";

const NAV_ITEMS = [
  { id: "nav-dashboard", labelKey: "dashboard.navDashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard/patient" },
  { id: "nav-plan",      labelKey: "dashboard.navPlan",      icon: <UtensilsCrossed size={20} />, path: "/plan" },
  { id: "nav-history",   labelKey: "dashboard.navHistory",   icon: <History size={20} />,         path: "/history/patient" },
  { id: "nav-profile",   labelKey: "dashboard.navProfile",   icon: <User size={20} />,            path: "/profile" },
] as const;

/** Responsive nav: sidebar ≥ md, bottom bar < md. */
export const PatientNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation("patient");

  const active = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col bg-card border-r border-border z-40 pt-16 pb-6 shadow-sm">
        <div className="px-5 pb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Leaf size={16} className="text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight">HealthCore</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active(item.path)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={active(item.path) ? "text-primary" : ""}>{item.icon}</span>
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
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
              active(item.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={active(item.path) ? "text-primary" : ""}>{item.icon}</span>
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
