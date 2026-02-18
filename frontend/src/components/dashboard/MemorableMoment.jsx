import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MemorableMoment({ aiInsight, recentHistory, recommendedStudy }) {
  const [displayedInsight, setDisplayedInsight] = useState("");
  
  // Ref to track the 'previous' text so we don't restart if it's the same
  const lastInsightRef = useRef(null);
  
  useEffect(() => {
    // 1. SAFETY CHECK:
    // If the new 'aiInsight' is exactly the same as the last one we processed,
    // DO NOT reset the typewriter. Just exit.
    if (aiInsight === lastInsightRef.current) {
        return;
    }

    // 2. It's actually new text! Update our tracker.
    lastInsightRef.current = aiInsight;
    
    // 3. Reset display
    setDisplayedInsight(""); 
    
    if (!aiInsight) {
      setDisplayedInsight("No insights yet.");
      return;
    }

    let charIndex = 0;
    const typingSpeed = 20; 

    const intervalId = setInterval(() => {
      charIndex++;
      setDisplayedInsight(aiInsight.slice(0, charIndex));
      if (charIndex >= aiInsight.length) {
        clearInterval(intervalId);
      }
    }, typingSpeed);

    return () => clearInterval(intervalId);
  }, [aiInsight]);

  // --- HELPERS ---
  const formatPnl = (pnl) => `${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}`;
  
  const calculatePnl = (trade) => {
    // Safety check for missing data
    if (!trade || !trade.exit_price || !trade.entry_price) return 0;
    
    let pnl = (trade.exit_price - trade.entry_price) * trade.volume;
    return trade.side.toLowerCase() === "sell" ? pnl * -1 : pnl;
  };
  
  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'
    });
  };

  const hasRecentHistory = recentHistory && recentHistory.length > 0;
  const hasRecommendation = recommendedStudy && recommendedStudy.module;

  return (
    <div className="bg-white border rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold flex items-center gap-2 text-sm text-purple-800">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Insight & Action
        </h3>
      </div>
      
      <div className="p-3 flex-1 flex flex-col gap-3">
        {/* Insight Container */}
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-100 text-sm md:text-base text-slate-800 leading-relaxed min-h-[80px]">
          <div className="prose prose-sm prose-slate prose-strong:text-purple-800 prose-strong:font-bold italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedInsight}
            </ReactMarkdown>
          </div>
          {/* Cursor blinks only while typing */}
          {displayedInsight.length < (aiInsight || "").length && (
             <span className="ml-1 inline-block w-1.5 h-4 bg-purple-600 animate-pulse align-middle"></span>
          )}
        </div>

        {/* Compact Trade List */}
        {hasRecentHistory && (
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Activity</p>
            <div className="space-y-1.5">
              {[...recentHistory].reverse().slice(0, 3).map((trade, i) => {
                const pnl = calculatePnl(trade);
                const isWin = pnl >= 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
                    <span className="font-medium text-slate-700">{trade.asset}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isWin ? "text-green-600" : "text-red-600"}`}>
                        {formatPnl(pnl)}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatTime(trade.close_time)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Slim Recommendation Banner */}
        {hasRecommendation && (
          <div className="mt-auto pt-2 border-t border-slate-100">
             <Link to={`/curriculum`} className="group flex items-center justify-between p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all text-white">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Lightbulb className="h-4 w-4 flex-shrink-0 text-yellow-300" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] opacity-90 uppercase font-semibold tracking-wider">Recommended</span>
                        <span className="text-xs font-medium truncate">{recommendedStudy.module}</span>
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}