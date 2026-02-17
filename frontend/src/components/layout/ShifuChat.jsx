import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, X, MessageCircle, ShieldCheck, Info } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askTutorStream } from "../../ai/aiTutor";

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
  
  // NEW: State for the RAG Context Modal
  const [selectedContext, setSelectedContext] = useState(null);
  
  const scrollRef = useRef(null);

  // Listen for custom events from external components
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

  // Handle Text Selection for "Ask Shifu" tooltip
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
      ragContext: null // Initialize context storage
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
             // HANDLE FINAL METADATA PACKET
             // Store the context data directly in the message object
             if (chunk.is_rag_verified) {
                 setMessages(prev => prev.map(m => 
                     m.id === assistantMsgId ? { 
                       ...m, 
                       verified: true,
                       ragContext: chunk.context // Store the full context data here
                     } : m
                 ));
             }
        } else {
             // HANDLE TEXT CHUNKS
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
      {/* Highlight Tooltip */}
      {selection.visible && (
        <button
          onClick={askAboutHighlight}
          style={{ left: selection.x, top: selection.y }}
          className="fixed z-[9999] flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-2xl animate-in fade-in zoom-in duration-200 hover:bg-purple-700"
        >
          <Sparkles className="h-3 w-3 text-purple-200" /> Ask Shifu
        </button>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="text-sm">{isOpen ? "Close" : "ASK SHIFU"}</span>
      </button>

      {/* Chat Interface Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] flex h-[600px] w-[90vw] sm:w-[600px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-2 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-white">
            <div className="bg-purple-600 p-1.5 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-lg">Shifu AI</span>
          </div>

          {/* Message History Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "assistant" 
                    ? "bg-slate-100 text-slate-800 rounded-bl-none" 
                    : "bg-purple-600 text-white rounded-br-none"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-slate max-w-none 
                      prose-p:my-0.5 prose-headings:text-purple-700 
                      prose-strong:text-purple-800 prose-code:text-purple-600
                      prose-code:bg-purple-50 prose-code:px-1 prose-code:rounded">
                      
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>

                      {/* RAG VERIFIED BADGE (Clickable) */}
                      {m.verified && (
                        <button 
                          onClick={() => setSelectedContext(m.ragContext)}
                          className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 select-none w-full hover:bg-slate-200/50 rounded transition-colors group cursor-pointer"
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
            
            {/* Typing Indicator */}
            {isTyping && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-1 p-2 ml-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
            )}
          </div>

          {/* Input Field Area */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-1 focus-within:border-purple-400 focus-within:bg-white transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message Shifu..."
                className="flex-1 bg-transparent py-2 text-sm outline-none text-slate-700"
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

      {/* CONTEXT MODAL OVERLAY */}
      {selectedContext && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
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

            {/* Modal Content */}
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
            
            {/* Modal Footer */}
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