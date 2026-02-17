import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ChevronRight,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CURRICULUM_MODULES } from "../data/curriculum";
import { fetchDashboard } from "../api/dashboard";
import { fetchCurriculumStatus } from "../api/curriculum";

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [finishedChapters, setFinishedChapters] = useState([]);
  const [recommendedStudy, setRecommendedStudy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = "william";

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch recommended study
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
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const handleChapterComplete = () => {
      const updatedFinishedChapters = JSON.parse(localStorage.getItem(`finishedChapters_${userId}`)) || [];
      setFinishedChapters(updatedFinishedChapters);
      fetchDashboard(userId).then(data => setRecommendedStudy(data.recommended_study));
    };
    
    const handleDashboardUpdate = () => {
      console.log("[ModuleDetail] Dashboard update received, syncing...");
      loadData();
    };

    // Listen for visibility changes to sync when returning to page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
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
  }, [userId]);

  const module = CURRICULUM_MODULES.find((m) => m.id === moduleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-slate-700">Loading...</p>
      </div>
    );
  }

  if (!module) {
    return <p className="text-center p-6 text-red-600">Module not found</p>;
  }

  // Handle both array and legacy single object format
  const recArray = Array.isArray(recommendedStudy) ? recommendedStudy : 
                   (recommendedStudy ? [recommendedStudy] : []);
  const recommendedLessons = recArray.map(r => r.module).filter(Boolean);

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 flex gap-2">
        <Link to="/curriculum" className="hover:underline">Curriculum</Link>
        <span>/</span>
        <span>{module.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate("/curriculum")}
          className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{module.title}</h1>
          <p className="text-slate-600">{module.description}</p>
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {module.lessons.map((lessonName, index) => {
          const isCompleted = finishedChapters.includes(lessonName);
          const isRecommended = recommendedLessons.includes(lessonName);

          return (
            <div
              key={lessonName}
              onClick={() =>
                navigate(`/curriculum/${moduleId}/${encodeURIComponent(lessonName)}`)
              }
              className={`
                bg-white border rounded-xl p-5 cursor-pointer transition-all
                ${isRecommended 
                  ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300 hover:shadow-lg" 
                  : "hover:shadow-md hover:border-blue-300"
                }
              `}
            >
              <div className="flex gap-4 items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium ${isRecommended ? "bg-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {isRecommended ? (
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isRecommended ? "text-amber-800" : "text-slate-800"}`}>
                    {lessonName}
                    {isRecommended && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        - Shifu Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isCompleted ? 'Completed' : 'Start Lesson'}
                  </p>
                </div>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : isRecommended ? (
                  <Sparkles className="h-5 w-5 text-amber-500" />
                ) : (
                  <ChevronRight className="text-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
