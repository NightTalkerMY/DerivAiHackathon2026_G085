import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, ChevronDown, ChevronUp } from "lucide-react";
import { askTutor } from "../ai/aiTutor";

/**
 * Message schema (LOCKED)
 * Backend must conform to this.
 */
const initialMessages = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your personal AI trading tutor.\n\nI'm here to help you understand trading concepts, strategies, and ideas.\n\nWhat would you like to learn today?",
    timestamp: new Date(),
  },
];

const suggestedQuestions = [
  "What is a pip in forex trading?",
  "How do I calculate position size?",
  "Explain support and resistance levels",
  "What's the best time to trade EUR/USD?",
  "How do I manage risk in volatile markets?",
];

export default function AITutor() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedContextId, setExpandedContextId] = useState(null); // NEW
  const scrollRef = useRef(null);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend() {
    if (!input.trim() || isTyping) return;

    const payload = {
      user_id: "william",
      query: input,
      user_state: {
        current_chapter: "2. Risk Management",
        finished_chapters: ["1. Psychology"],
        unfinished_chapters: ["3. Technical Analysis"],
        win_rate: "45%",
      },
    };

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: new Date(),
      },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const response = await askTutor(payload);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.answer,
          context: response.context || null,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            "⚠️ Something went wrong while contacting the AI tutor. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            AI Trading Tutor
          </h1>
          <p className="text-slate-600">
            Ask anything about trading concepts or strategies
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
          <Sparkles className="h-4 w-4" />
          AI Powered
        </span>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const hasContext = Boolean(m.context?.text);
            const isExpanded = expandedContextId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    m.role === "assistant"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    m.role === "assistant"
                      ? "bg-slate-100 text-slate-900"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {m.content}

                  {/* ✅ RAG VERIFIED BADGE */}
                  {m.role === "assistant" && hasContext && (
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setExpandedContextId(isExpanded ? null : m.id)
                        }
                        className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 hover:bg-emerald-100 transition"
                      >
                        ✅ RAG Verified
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {/* 🔍 CONTEXT PANEL */}
                      {isExpanded && (
                        <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">
                            Context Retrieved:
                          </span>{" "}
                          {m.context.text.slice(0, 100)}
                          {m.context.text.length > 100 && "..."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-slate-100">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse delay-100" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="border-t border-slate-200 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about trading..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
