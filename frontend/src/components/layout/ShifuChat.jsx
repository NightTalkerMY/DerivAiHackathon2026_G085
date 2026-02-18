import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import Navigation
import { Send, Sparkles, Bot, X, MessageCircle, ShieldCheck, Info, BookOpen, TrendingUp, ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askTutorStream } from "../../ai/aiTutor";
// 2. Import Curriculum Data to check for valid modules
import { CURRICULUM_MODULES } from "../../data/curriculum"; 

export function ShifuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: "1", 
      role: "assistant", 
      content: "Greetings. I am **Shifu**. How may I guide your trading journey today?", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selection, setSelection] = useState({ text: "", x: 0, y: 0, visible: false });
  const [selectedContext, setSelectedContext] = useState(null);
  
  const scrollRef = useRef(null);
  const navigate = useNavigate(); // 3. Initialize Hook

  // --- HELPER: Find Module ID ---
  const findModuleId = (name) => {
    if (!name) return null;
    const cleanName = name.trim();
    // Try to find exact match in lessons
    for (const module of CURRICULUM_MODULES) {
      if (module.title === cleanName || module.lessons.includes(cleanName)) {
        return module.id;
      }
    }
    return null;
  };

  // --- CUSTOM COMPONENT FOR LIST ITEMS (The Clickable Card) ---
  const InteractiveListItem = ({ children }) => {
    // We need to inspect the children to extract the Module Name
    // Structure is usually: [<strong>ModuleName</strong>, ": Reason text"]
    const childArray = React.Children.toArray(children);
    
    let moduleName = "";
    let reasonText = children; // Default to full content

    // Try to extract bold text as the Module Name
    if (childArray.length > 0 && childArray[0].type === "strong") {
       moduleName = childArray[0].props.children;
       
       // Clean up the "Reason" text (remove the leading colon if present)
       if (childArray.length > 1 && typeof childArray[1] === 'string') {
          const text = childArray[1];
          // Remove ": " from the start if it exists due to markdown format
          const cleanText = text.startsWith(':') ? text.substring(1).trim() : text;
          
          // Reconstruct the children without the awkward colon
          reasonText = [childArray[0], <span key="text" className="text-slate-600 block mt-1 font-normal">{cleanText}</span>];
       }
    }

    const targetId = findModuleId(moduleName);
    const isClickable = !!targetId;

    return (
      <div 
        onClick={() => isClickable && navigate(`/curriculum/${targetId}`)}
        className={`
          bg-white border border-slate-200 rounded-xl p-4 my-2 shadow-sm 
          transition-all duration-200 relative overflow-hidden group
          ${isClickable ? "hover:shadow-md hover:border-purple-300 cursor-pointer" : ""}
        `}
      >
        {/* Hover Highlight */}
        {isClickable && (
           <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
        
        <div className="relative z-10 flex items-start gap-3">
          <div className={`
            p-2 rounded-lg shrink-0 transition-colors
            ${isClickable ? "bg-purple-50 text-purple-600 group-hover:bg-purple-100" : "bg-slate-50 text-slate-400"}
          `}>
             <BookOpen className="w-5 h-5" strokeWidth={2} />
          </div>
          
          <div className="flex-1 min-w-0">
             <div className="text-[14px] text-slate-700 leading-relaxed font-medium">
               {reasonText}
             </div>
          </div>

          {/* Arrow Icon if Clickable */}
          {isClickable && (
            <div className="self-center text-slate-300 group-hover:text-purple-500 transition-colors">
               <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MEMOIZED RENDERERS ---
  const MarkdownComponents = useMemo(() => ({
    // 1. Headers
    h3: ({children}) => (
      <div className="flex items-center gap-2 mt-6 mb-3 pb-2 border-b border-slate-100">
        <TrendingUp className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          {children}
        </span>
      </div>
    ),
    
    // 2. Insight Box
    blockquote: ({children}) => (
      <div className="relative bg-gradient-to-r from-purple-50 to-white border-l-4 border-purple-500 rounded-r-xl p-4 my-4 shadow-sm group">
        <div className="flex gap-3 relative z-10">
          <div className="bg-purple-100 p-1.5 rounded-lg h-fit mt-0.5">
              <Sparkles className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-slate-700 text-[15px] italic leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </div>
    ),

    // 3. Container for list
    ul: ({children}) => (
      <div className="flex flex-col gap-1 my-3">
        {children}
      </div>
    ),

    // 4. Use our Smart Component for List Items
    li: InteractiveListItem,
    
    // 5. Bold Text (Title) - removed 'block' to fix the line break issue
    strong: ({children}) => (
      <span className="text-slate-900 font-bold">
        {children}
      </span>
    )
  }), [navigate]); // Re-create if navigate changes (rare)

  // ... (Keep existing scrollRef, useEffects, handleSend logic unchanged) ...
  // Paste everything below `const scrollRef = useRef(null);` from your previous file here.
  // Just ensure the return statement uses `components={MarkdownComponents}`

  useEffect(() => {
    const handleExternalMessage = (event) => {
      const { content } = event.detail;
      const newMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsOpen(true);
    };
    window.addEventListener("shifu-add-message", handleExternalMessage);
    return () => window.removeEventListener("shifu-add-message", handleExternalMessage);
  }, []);

  // Handle Text Selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText && selectedText.length > 3) {
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text: selectedText,
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 40,
          visible: true
        });
      } else {
        setSelection(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const askAboutHighlight = () => {
    setIsOpen(true);
    handleSend(`Can you explain this: "${selection.text}"?`);
    setSelection(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (overrideInput) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = { 
      id: Date.now().toString(), 
      role: "user", 
      content: textToSend 
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholder = { 
      id: assistantMsgId, 
      role: "assistant", 
      content: "", 
      timestamp: new Date(),
      verified: false,
      ragContext: null 
    };
    
    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setIsTyping(true);

    try {
      let accumulatedContent = "";
      const stream = askTutorStream({ 
        user_id: "william", 
        query: textToSend 
      });

      for await (const chunk of stream) {
        if (typeof chunk === 'object' && chunk.done) {
             if (chunk.is_rag_verified) {
                 setMessages(prev => prev.map(m => 
                     m.id === assistantMsgId ? { 
                       ...m, 
                       verified: true,
                       ragContext: chunk.context 
                     } : m
                 ));
             }
        } else {
             accumulatedContent += chunk;
             setMessages(prev => prev.map(m => 
               m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
             ));
        }
      }
    } catch (err) {
      console.error("Chat Stream Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {selection.visible && (
        <button
          onClick={askAboutHighlight}
          style={{ left: selection.x, top: selection.y }}
          className="fixed z-[9999] flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-2xl animate-in fade-in zoom-in duration-200 hover:bg-purple-700"
        >
          <Sparkles className="h-3 w-3 text-purple-200" /> Ask Shifu
        </button>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="text-sm">{isOpen ? "Close" : "ASK SHIFU"}</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] flex h-[560px] w-[95vw] sm:w-[640px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-2 overflow-hidden">
          
          <div className="flex items-center gap-3 p-4 border-b bg-white">
            <div className="bg-purple-600 p-1.5 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-lg">Shifu AI</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`max-w-[90%] rounded-2xl px-5 py-3.5 text-[15px] font-medium shadow-sm ${
                  m.role === "assistant" 
                    ? "bg-white text-slate-900 rounded-bl-none border border-slate-200" 
                    : "bg-purple-600 text-white rounded-br-none"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {m.content}
                      </ReactMarkdown>

                      {m.verified && (
                        <button 
                          onClick={() => setSelectedContext(m.ragContext)}
                          className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 select-none w-full hover:bg-slate-50 rounded transition-colors group cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            RAG VERIFIED
                          </span>
                          <Info className="w-3 h-3 text-slate-400 ml-auto group-hover:text-emerald-500" />
                        </button>
                      )}
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-1 p-2 ml-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1 focus-within:border-purple-400 focus-within:bg-white transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message Shifu..."
                className="flex-1 bg-transparent py-3 text-[15px] font-medium outline-none text-slate-900 placeholder:text-slate-400"
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isTyping || !input.trim()}
                className="text-purple-600 hover:text-purple-800 disabled:text-slate-300 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedContext && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Source Materials</h3>
                    <p className="text-xs text-slate-500">Shifu based the answer on these docs</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContext(null)} 
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white">
              {Array.isArray(selectedContext) ? (
                selectedContext.map((ctx, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            SOURCE {idx + 1}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
                        {ctx.text || ctx.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
                    {selectedContext.text || selectedContext.content || "No source text available."}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t text-center">
                <button 
                    onClick={() => setSelectedContext(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                    Close Verification
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}