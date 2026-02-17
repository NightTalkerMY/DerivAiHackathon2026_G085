import { useEffect, useState } from "react";
import {
  User,
  Camera,
  BookOpen,
  Bell,
  RefreshCw,
  Download,
  LogOut,
  Award,
  TrendingUp,
} from "lucide-react";
import { fetchDashboard } from "../api/dashboard";

/* ---------------- PAGE ---------------- */

export default function Settings() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetchDashboard("william")
      .then((res) => {
        setData(res);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-slate-600 mt-1">Unable to load settings. Please try again.</p>
      </div>
    );
  }

  // Extract data from dashboard response
  const { user_info, competency_radar, performance_summary, learning } = data;
  
  // Calculate total XP from competency scores
  const totalXp = Object.values(competency_radar || {}).reduce((sum, val) => sum + val, 0) * 10;
  
  // Determine level from XP
  const getLevel = (xp) => {
    if (xp >= 500) return "Master";
    if (xp >= 300) return "Advanced";
    if (xp >= 150) return "Intermediate";
    return "Beginner";
  };

  const level = getLevel(totalXp);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 p-6 rounded-2xl border border-purple-100">
        <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user_info?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center hover:bg-purple-50 transition-colors">
              <Camera className="h-4 w-4 text-purple-600" />
            </button>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold text-lg">{user_info?.username || "Trader"}</h3>
            <p className="text-sm text-purple-600 font-medium">
              {level} • {totalXp} XP
            </p>
            <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Member since Jan 2024
            </span>
          </div>
        </div>

        <Divider />

        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField label="Display Name" value={user_info?.username || "N/A"} />
          <ReadOnlyField label="Email" value="william@example.com" />
        </div>

        <button className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg">
          Save Changes
        </button>
      </Section>

      {/* Learning Preferences */}
      <Section title="Learning Preferences" icon={BookOpen}>
        <Preference
          label="Current Level"
          description="Based on your progress"
          value={level}
          icon={<Award className="h-4 w-4 text-purple-500" />}
        />
        <Preference
          label="Preferred Market"
          description="Focus area for curriculum"
          value="Forex"
        />
        <Preference
          label="Learning Style"
          description="Content presentation"
          value="Visual + Examples"
        />
        
        <Divider />

        <div className="p-4 rounded-xl bg-purple-50">
          <p className="text-xs text-purple-600 font-medium mb-2">Current Chapter</p>
          <p className="text-sm font-semibold text-purple-900">{learning?.current_chapter || "Not started"}</p>
        </div>

        <button className="w-full mt-4 px-4 py-2.5 rounded-xl border-2 border-purple-200 text-purple-600 font-medium flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors">
          <RefreshCw className="h-4 w-4" />
          Retake Skill Assessment
        </button>
      </Section>

      {/* Performance Stats */}
      <Section title="Performance Stats" icon={TrendingUp}>
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="Total Trades" 
            value={performance_summary?.["number of trades"] || 0} 
          />
          <StatCard 
            label="Net P&L" 
            value={`$${performance_summary?.["total profit and loss"]?.toFixed(2) || "0.00"}`}
            positive={performance_summary?.["total profit and loss"] >= 0}
          />
          <StatCard 
            label="Win Rate" 
            value={`${performance_summary?.["directional accuracy percentage"] || 0}%`} 
          />
          <StatCard 
            label="Chapters Done" 
            value={learning?.finished_chapters?.length || 0} 
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Toggle label="Daily Reminders" defaultOn />
        <Toggle label="Achievement Notifications" defaultOn />
        <Toggle label="New Content Alerts" />
      </Section>

      {/* Data & Privacy */}
      <Section title="Data & Privacy">
        <button className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <Download className="h-4 w-4" />
          Export My Progress
        </button>

        <button className="w-full px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </Section>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="p-4 border-b bg-slate-50 rounded-t-xl">
        <h3 className="font-semibold flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-purple-600" />}
          {title}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-200 my-4" />;
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="mt-1 px-4 py-2.5 rounded-lg bg-slate-100 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}

function Preference({ label, description, value, icon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors">
      <div className="flex items-center gap-3">
        {icon && <span className="text-purple-500">{icon}</span>}
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium">
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, positive }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${positive !== undefined ? (positive ? "text-green-600" : "text-red-600") : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}

function Toggle({ label, defaultOn = false }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <p className="font-medium">{label}</p>
      <div
        className={`w-11 h-6 rounded-full transition-all duration-200 ${
          defaultOn ? "bg-purple-600" : "bg-slate-300"
        } relative cursor-pointer`}
      >
        <div
          className={`h-5 w-5 rounded-full bg-white absolute top-0.5 shadow-md transition-all duration-200 ${
            defaultOn ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </div>
  );
}
