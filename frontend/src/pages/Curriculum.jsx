import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  ChevronRight,
  Shield,
  Target,
  Loader2,
  Sparkles,
  Brain,
  Lightbulb,
  ArrowRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import { fetchDashboard } from "../api/dashboard";
import { fetchCurriculumStatus } from "../api/curriculum";
import { CURRICULUM_MODULES } from "../data/curriculum";

// Map string icon names to Lucide React components
const iconMap = {
  BookOpen: BookOpen,
  Shield: Shield,
};

// Find module ID by lesson name
const findModuleByLesson = (lessonName) => {
  for (const module of CURRICULUM_MODULES) {
    if (module.lessons.includes(lessonName)) {
      return module.id;
    }
  }
  return null;
};

// AI Recommendations Carousel
function AIRecommendationsCarousel({ recommendations, onStartLearning, isLoading }) {
  // Handle both array and legacy single object format
  const recArray = Array.isArray(recommendations) ? recommendations : 
                   (recommendations ? [recommendations] : []);
  
  if (recArray.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiMzMzQ1NmEiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
            <Brain className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">Complete trades to get AI-powered learning recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-violet-600" />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Shifu Recommendations</p>
        <span className="text-xs text-slate-400">({recArray.length})</span>
      </div>
      
      {/* Horizontal Scrollable Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {recArray.map((rec, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 border border-violet-400/30 rounded-xl p-4 shadow-lg shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-purple-400/20 rounded-full blur-xl"></div>

            <div className="relative z-10">
              {/* Module Name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-white font-bold text-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  {rec.module}
                </h3>
              </div>
              
              {/* Reason */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/10 mb-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <p className="text-violet-100 text-xs leading-relaxed line-clamp-3">
                    {rec.reason}
                  </p>
                </div>
              </div>
              
              {/* Button */}
              <button
                onClick={() => onStartLearning(rec.module)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium text-xs py-2 px-3 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3 w-3 text-amber-300" />
                    Learn
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ completed, total }) {
  const percentage = (completed / total) * 100 || 0;
  
  return (
    <div className="bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-indigo-600/20 border border-violet-300/30 backdrop-blur-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-violet-600/80 text-xs font-medium">Your Progress</p>
            <p className="text-violet-900 font-semibold">{completed} of {total} lessons</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            {Math.round(percentage)}%
          </p>
        </div>
      </div>
      <div className="h-3 bg-violet-200/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Curriculum() {
  const navigate = useNavigate();
  const [recommendedStudy, setRecommendedStudy] = useState(null);
  const [finishedChapters, setFinishedChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const userId = "william"; 

  const loadCurriculumData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Fetch dashboard data (includes recommendations)
      const dashboardData = await fetchDashboard(userId);
      setRecommendedStudy(dashboardData.recommended_study);

      // Fetch curriculum status from backend (includes finished chapters from users.json)
      try {
        const curriculumStatus = await fetchCurriculumStatus(userId);
        const backendFinishedChapters = curriculumStatus.finished_chapters || [];
        
        // Also get localStorage as backup/additional
        const localFinishedChapters = JSON.parse(localStorage.getItem(`finishedChapters_${userId}`)) || [];
        
        // Merge both lists (backend takes priority, localStorage as backup)
        const mergedChapters = [...new Set([...backendFinishedChapters, ...localFinishedChapters])];
        
        // Update localStorage to stay in sync
        localStorage.setItem(`finishedChapters_${userId}`, JSON.stringify(mergedChapters));
        
        setFinishedChapters(mergedChapters);
      } catch (curriculumErr) {
        // Fallback to localStorage if curriculum status fails
        console.warn("Failed to fetch curriculum status, using localStorage:", curriculumErr);
        const localFinishedChapters = JSON.parse(localStorage.getItem(`finishedChapters_${userId}`)) || [];
        setFinishedChapters(localFinishedChapters);
      }

    } catch (err) {
      console.error("Failed to load curriculum data:", err);
      setError("Failed to load curriculum data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCurriculumData();

    // Listen for chapter completion events
    const handleChapterComplete = () => {
      const storedFinishedChapters = JSON.parse(localStorage.getItem(`finishedChapters_${userId}`)) || [];
      setFinishedChapters(storedFinishedChapters);
      loadCurriculumData(true);
    };

    // Listen for dashboard updates (syncs with users.json changes)
    const handleDashboardUpdate = () => {
      console.log("[Curriculum] Dashboard update received, syncing...");
      loadCurriculumData(true);
    };

    // Listen for visibility changes to sync when returning to page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCurriculumData(true);
      }
    };

    window.addEventListener('chapterComplete', handleChapterComplete);
    window.addEventListener('dashboard-update', handleDashboardUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('chapterComplete', handleChapterComplete);
      window.removeEventListener('dashboard-update', handleDashboardUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCurriculumData]);

  // Handle start learning click from AI recommendation (supports both single and array formats)
  const handleStartLearning = (moduleName) => {
    // If moduleName is provided, use it; otherwise try the first recommendation
    const targetModule = moduleName || 
      (Array.isArray(recommendedStudy) ? recommendedStudy[0]?.module : recommendedStudy?.module);
    
    if (targetModule) {
      const moduleId = findModuleByLesson(targetModule);
      if (moduleId) {
        navigate(`/curriculum/${moduleId}`);
      }
    }
  };

  const totalLessons = CURRICULUM_MODULES.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );

  const completedLessons = CURRICULUM_MODULES.reduce((acc, module) => {
    return acc + module.lessons.filter(lesson => finishedChapters.includes(lesson)).length;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div className="absolute inset-0 h-16 w-16 rounded-2xl border-2 border-violet-400/30 animate-ping"></div>
        </div>
        <p className="text-slate-600 font-medium">Loading your learning path...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-red-600 font-semibold mb-2">Unable to Load Curriculum</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => loadCurriculumData()}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get recommended modules for highlighting (handle both array and legacy format)
  const recArray = Array.isArray(recommendedStudy) ? recommendedStudy : 
                   (recommendedStudy ? [recommendedStudy] : []);
  const recommendedModules = recArray.map(r => r.module).filter(Boolean);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
          Your Curriculum
        </h1>
      </div>

      {/* AI Recommendations Carousel */}
      <AIRecommendationsCarousel 
        recommendations={recommendedStudy} 
        onStartLearning={handleStartLearning}
        isLoading={isRefreshing}
      />

      {/* Progress Bar */}
      <ProgressBar completed={completedLessons} total={totalLessons} />

      {/* Section Title */}
      <div className="flex items-center gap-3 mt-8">
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Learning Modules</p>
        <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent"></div>
      </div>

      {/* Modules - Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CURRICULUM_MODULES.map((module) => {
          const Icon = iconMap[module.icon] || BookOpen;
          const isRecommended = recommendedModules.length > 0 && 
            module.lessons.some(lesson => recommendedModules.includes(lesson));
          const isRecommendedModule = isRecommended;

          return (
            <div
              key={module.id}
              onClick={() => navigate(`/curriculum/${module.id}`)}
              className={`
                group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-pointer
                hover:scale-[1.02] hover:shadow-xl
                ${isRecommendedModule 
                  ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 border border-violet-400/30 shadow-lg shadow-purple-500/20" 
                  : "bg-white border border-slate-200/60 hover:border-cyan-300/50 hover:shadow-lg hover:shadow-cyan-200/20"
                }
              `}
            >
              {/* Glow effect for recommended */}
              {isRecommendedModule && (
                <>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>
                </>
              )}

              <div className="relative z-10 flex flex-col h-full">
                {/* Header: Icon + Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`
                    h-12 w-12 rounded-xl flex items-center justify-center
                    ${isRecommendedModule 
                      ? "bg-white/20 backdrop-blur-sm" 
                      : "bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-cyan-100 group-hover:to-blue-200"
                    }
                  `}>
                    {isRecommendedModule ? (
                      <Sparkles className="text-white h-6 w-6" />
                    ) : (
                      <Icon className={`text-slate-600 group-hover:text-cyan-600 transition-colors h-6 w-6`} />
                    )}
                  </div>
                  
                  {isRecommendedModule && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-violet-700 bg-white/90 backdrop-blur-sm rounded-full">
                      <Sparkles className="h-2.5 w-2.5" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={`font-bold text-base mb-1 ${isRecommendedModule ? "text-white" : "text-slate-800"}`}>
                    {module.title}
                  </h3>
                  <p className={`text-xs line-clamp-2 ${isRecommendedModule ? "text-violet-100" : "text-slate-500"}`}>
                    {module.description}
                  </p>
                </div>

                {/* Footer: Metadata + CTA */}
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-white/10">
                  <div className={`flex items-center gap-3 text-xs ${isRecommendedModule ? "text-violet-200" : "text-slate-400"}`}>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {module.lessons.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {module.duration.replace('Approx. ', '')}
                    </span>
                  </div>
                  
                  <div className={`
                    h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300
                    ${isRecommendedModule 
                      ? "bg-white/20 text-white group-hover:bg-white/30" 
                      : "bg-slate-100 text-slate-400 group-hover:bg-cyan-100 group-hover:text-cyan-600"
                    }
                  `}>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
