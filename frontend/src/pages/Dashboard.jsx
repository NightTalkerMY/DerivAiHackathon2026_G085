import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard, triggerInsightGeneration } from "../api/dashboard";
import { CompetencyRadar } from "../components/dashboard/CompetencyRadar";
import { MemorableMoment } from "../components/dashboard/MemorableMoment";
import { PerformanceSummary } from "../components/dashboard/PerformanceSummary";

import { AlertCircle } from "lucide-react";

/* ---------------- PAGE ---------------- */

function SkeletonHeader() {
  return (
    <div>
      <div className="h-8 w-64 bg-slate-200 rounded mb-2 animate-pulse" />
      <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

function Header({ name }) {
  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 via-white to-purple-50 p-6 rounded-2xl shadow-sm border border-purple-100">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Welcome back, <span className="text-purple-600">{name}</span>
        </h1>
        <p className="text-slate-600 mt-1">
          Your learning journey starts here
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  
  // 1. GUARD: Tracks if the initial load has started
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 2. CHECK: If we already started loading, STOP immediately.
    // This blocks React Strict Mode from firing the AI trigger a second time.
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = () => {
      fetchDashboard("william")
        .then((res) => {
          setData(res);
          setStatus("success");
          
          // 3. Trigger AI only once
          return triggerInsightGeneration("william");
        })
        .then((newInsightData) => {
          if (newInsightData && newInsightData.insight) {
             setData(prevData => {
                // Smart Update: Don't update state if text hasn't changed
                if (prevData && prevData.ai_insight === newInsightData.insight) {
                   return prevData; 
                }
                return {
                   ...prevData,
                   ai_insight: newInsightData.insight
                };
             });
          }
        })
        .catch((err) => {
          console.error("Dashboard load failed:", err);
          if (!data) setStatus("error"); 
        });
    };

    loadData();

  }, []); // Run once on mount

  // Separate useEffect for the Event Listener to keep the logic clean
  useEffect(() => {
    const handleDashboardUpdate = () => {
      console.log("[DEBUG] Refreshing dashboard data...");
      // Re-fetch data silently (without status change)
      fetchDashboard("william").then((res) => setData(res));
    };

    window.addEventListener("dashboard-update", handleDashboardUpdate);
    return () => window.removeEventListener("dashboard-update", handleDashboardUpdate);
  }, []);

  /* ---------------- STATES ---------------- */

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <Header name="Guest" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex gap-3 shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-600">Unable to load dashboard</p>
            <p className="text-sm text-red-500">Please ensure the backend is running.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    user_info,
    ai_insight,
    competency_radar,
    performance_summary,
    recent_history,
    recommended_study,
  } = data;

  return (
    <div className="space-y-6">
      <Header name={user_info.username} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="h-full">
          <CompetencyRadar competencyRadarData={competency_radar} />
        </div>
        <div className="h-full">
          <PerformanceSummary performanceSummaryData={performance_summary} />
        </div>
        <div className="h-full">
          <MemorableMoment
            aiInsight={ai_insight}
            recentHistory={recent_history}
            recommendedStudy={recommended_study}
          />
        </div>
      </div>
    </div>
  );
}