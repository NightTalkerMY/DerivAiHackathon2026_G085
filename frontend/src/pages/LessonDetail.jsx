import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, MessageCircle, Loader2, ArrowLeft, Lightbulb, FileText, Sparkles } from 'lucide-react';
import { askCurriculumConcept, markChapterComplete, fetchCurriculumStatus } from '../api/curriculum';
import { fetchDashboard } from '../api/dashboard';
import { LESSON_CONTENTS } from '../data/curriculum';

function ChatbotOverlay({ explanation, isLoading, onClose }) {
  if (!explanation && !isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Shifu's Explanation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Shifu is thinking...</span>
          </div>
        ) : (
          <p className="text-slate-700 leading-relaxed">{explanation}</p>
        )}
      </div>
    </div>
  );
}

export default function LessonDetail() {
  const { chapterName } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [chapterContent, setChapterContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [recommendedStudy, setRecommendedStudy] = useState(null);

  const [highlightedText, setHighlightedText] = useState('');
  const [showAskAIButton, setShowAskAIButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const [showChatbotOverlay, setShowChatbotOverlay] = useState(false);
  const [chatbotExplanation, setChatbotExplanation] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);

  const userId = "william";

  // Effect to load chapter content, check completion status, and fetch recommendation
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingContent(true);
      
      // Load content from JSON
      const content = LESSON_CONTENTS[chapterName];
      if (content) {
        setChapterContent(content);
      } else {
        setChapterContent({ 
          title: "Chapter Not Found", 
          content: "<p>The content for this chapter could not be loaded.</p>",
          flashcards: [],
          keyPoints: []
        });
      }

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
        
        setIsCompleted(mergedChapters.includes(chapterName));
      } catch (curriculumErr) {
        // Fallback to localStorage if curriculum status fails
        console.warn("Failed to fetch curriculum status, using localStorage:", curriculumErr);
        const storedFinishedChapters = JSON.parse(localStorage.getItem(`finishedChapters_${userId}`)) || [];
        setIsCompleted(storedFinishedChapters.includes(chapterName));
      }

      // Fetch recommended study
      try {
        const dashboardData = await fetchDashboard(userId);
        setRecommendedStudy(dashboardData.recommended_study);
      } catch (err) {
        console.error("Failed to fetch recommendation:", err);
      }

      setIsLoadingContent(false);
    };

    loadData();
    
    // Listen for visibility changes to sync when returning to page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chapterName, userId]);

  // Effect to handle text highlighting - FIXED: proper event handling
  useEffect(() => {
    // Store ref in a variable to avoid stale closure issues
    const contentArea = contentRef.current;
    
    const handleMouseUp = (e) => {
      // Don't process if clicking on the Ask AI button itself
      const askButton = document.getElementById('ask-ai-button');
      if (askButton && askButton.contains(e.target)) {
        return;
      }
      
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // Check if text is selected and is inside the content area
      if (text.length > 0 && contentArea && contentArea.contains(selection.anchorNode)) {
        // Only update if not already showing this text
        if (text !== highlightedText) {
          setHighlightedText(text);
        }
        
        // Calculate position - slightly offset from the end of selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setButtonPosition({
          x: rect.right + window.scrollX + 10,
          y: rect.top + window.scrollY - 40,
        });
        setShowAskAIButton(true);
      } else {
        // Only hide if selection is cleared or clicked outside
        setShowAskAIButton(false);
        setHighlightedText('');
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [highlightedText]);

  const handleAskAI = async () => {
    if (!highlightedText) return;
    
    // Hide button and show overlay
    setShowAskAIButton(false);
    setShowChatbotOverlay(true);
    setIsAskingAI(true);
    setChatbotExplanation('');

    try {
      const res = await askCurriculumConcept(userId, chapterName, highlightedText);
      setChatbotExplanation(res.explanation);
    } catch (error) {
      console.error("Error asking AI:", error);
      setChatbotExplanation("Sorry, Shifu couldn't get an explanation right now. Please try again.");
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      const res = await markChapterComplete(userId, chapterName);
      setIsCompleted(true);

      if (res && res.finished_chapters) {
        localStorage.setItem(`finishedChapters_${userId}`, JSON.stringify(res.finished_chapters));
        window.dispatchEvent(new Event('chapterComplete'));
      }

      alert(`Chapter "${chapterName}" marked as complete!`);
      navigate('/curriculum');
    } catch (error) {
      console.error("Failed to mark chapter complete:", error);
      alert("Failed to mark chapter complete. Please try again.");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Handle both array and legacy single object format
  const recArray = Array.isArray(recommendedStudy) ? recommendedStudy : 
                   (recommendedStudy ? [recommendedStudy] : []);
  const isRecommended = recArray.some(r => r.module === chapterName);

  if (isLoadingContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-slate-700">Loading lesson content...</p>
      </div>
    );
  }

  if (!chapterContent) {
    return <div className="p-6 text-red-600">Error loading lesson. Content not found.</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm relative">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 flex gap-2 mb-4">
        <Link to="/curriculum" className="hover:underline">Curriculum</Link>
        <span>/</span>
        <Link to="/curriculum" className="hover:underline">Modules</Link>
        <span>/</span>
        <span>{chapterContent.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{chapterContent.title}</h1>
            {isRecommended && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-amber-700 bg-amber-100 rounded-full border border-amber-300">
                <Sparkles className="h-4 w-4" />
                Shifu Recommendation
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" /> Completed
            </span>
          ) : (
            <button
              onClick={handleMarkComplete}
              disabled={isMarkingComplete}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarkingComplete ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Mark as Complete
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Direct ref, no memo wrapper */}
      <div 
        ref={contentRef} 
        className="prose max-w-none text-slate-700" 
        dangerouslySetInnerHTML={{ __html: chapterContent.content }} 
      />

      {/* Key Points Section */}
      {chapterContent.keyPoints && chapterContent.keyPoints.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5" />
            Key Points
          </h3>
          <ul className="space-y-2">
            {chapterContent.keyPoints.map((point, index) => (
              <li key={index} className="text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flashcards Section */}
      {chapterContent.flashcards && chapterContent.flashcards.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowFlashcards(!showFlashcards)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <FileText className="h-5 w-5" />
            {showFlashcards ? 'Hide Flashcards' : 'Show Flashcards'}
          </button>

          {showFlashcards && (
            <div className="grid gap-4 mt-4 md:grid-cols-2">
              {chapterContent.flashcards.map((card, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="font-semibold text-purple-900 mb-2">Q{index + 1}: {card.question}</p>
                  <p className="text-purple-700">{card.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ask AI Button - FIXED: Added unique ID for click detection */}
      {showAskAIButton && (
        <button
          id="ask-ai-button"
          onClick={handleAskAI}
          style={{ left: buttonPosition.x, top: buttonPosition.y }}
          className="fixed z-50 flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full shadow-lg hover:bg-blue-700 transition-colors animate-in fade-in zoom-in duration-200"
        >
          <MessageCircle className="h-4 w-4" /> Ask Shifu
        </button>
      )}

      <ChatbotOverlay
        explanation={chatbotExplanation}
        isLoading={isAskingAI}
        onClose={() => setShowChatbotOverlay(false)}
      />
    </div>
  );
}
