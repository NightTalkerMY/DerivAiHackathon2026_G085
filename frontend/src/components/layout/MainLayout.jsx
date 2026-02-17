import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { TopBar } from "./TopBar";
import { ShifuChat } from "./ShifuChat";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">
          <Outlet /> 
        </main>
      </div>

    <ShifuChat />
    </div>
  );
}
