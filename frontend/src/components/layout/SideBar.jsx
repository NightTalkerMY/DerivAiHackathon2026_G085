import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Curriculum", path: "/curriculum" },
  { icon: Activity, label: "Live Trade", path: "/live-trade" },
];

export function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full bg-white border-r transition-all duration-300 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <span className="font-semibold text-lg">TradeShifu</span>
            )}
          </Link>
          <button
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-violet-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                {isOpen && label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
