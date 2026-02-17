import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { fetchDashboard } from "../../api/dashboard";

export function TopBar({ onMenuClick }) {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let mounted = true;

    fetchDashboard("william").then((res) => {
      if (mounted) setDashboard(res);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Get user info from backend - use user_info for username
  const user = dashboard?.user_info;
  
  // Get title from competency or use default
  const userTitle = dashboard?.competency ? 
    Object.entries(dashboard.competency).reduce((a, b) => b[1] > a[1] ? b : a)[0] : 
    "Beginner";

  const initials = user?.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-800">{user?.username || "New User"}</p>
            <p className="text-xs text-slate-500 capitalize">
              {userTitle || "Beginner"}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-purple-500/30">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
