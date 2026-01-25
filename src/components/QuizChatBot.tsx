import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  sendChatMessage,
  ChatMessage,
  ChatContext,
} from "../services/chatService";

interface QuizChatBotProps {
  readonly context: ChatContext;
  readonly questionId: string;
  readonly isOpen: boolean;
  readonly onToggle: (open: boolean) => void;
}

let messageIdCounter = 0;
function generateMessageId(): string {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export function QuizChatBot({
  context,
  questionId,
  isOpen,
  onToggle,
}: Readonly<QuizChatBotProps>) {
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(
    new Map(),
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get messages for current question
  const currentMessages = messages.get(questionId) || [];

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      // Opening - render immediately
      setShouldRender(true);
      setIsAnimatingOut(false);
    } else if (shouldRender) {
      // Closing - start exit animation
      setIsAnimatingOut(true);
      // Unmount after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setInputValue("");

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: trimmedInput,
    };
    const updatedMessages = [...currentMessages, userMessage];

    setMessages((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, updatedMessages);
      return newMap;
    });

    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        trimmedInput,
        context,
        updatedMessages,
        undefined,
        undefined,
      );

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: response,
      };

      setMessages((prev) => {
        const newMap = new Map(prev);
        const currentMsgs = newMap.get(questionId) || [];
        // Keep only last 10 pairs (20 messages)
        const limitedMsgs = [...currentMsgs, assistantMessage].slice(-20);
        newMap.set(questionId, limitedMsgs);
        return newMap;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, currentMessages, questionId, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = useCallback(() => {
    setMessages((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, []);
      return newMap;
    });
    setError(null);
  }, [questionId]);

  // Render using portal to escape any parent container constraints
  return createPortal(
    <>
      {/* Chat Toggle Button - positioned on right edge, above app version */}
      <button
        onClick={() => onToggle(!isOpen)}
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "1rem",
          zIndex: 9999,
        }}
        className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-600"
            : "bg-indigo-500 hover:bg-indigo-400"
        }`}
        title={isOpen ? "Close chat" : "Ask AI about this question"}>
        {isOpen ? (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {shouldRender && (
        <div
          style={{
            position: "fixed",
            bottom: "9rem",
            right: "1rem",
            zIndex: 9999,
          }}
          className={`w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-12rem)] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
            isAnimatingOut ? 'animate-chat-out' : 'animate-chat-in'
          }`}>
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-100 text-sm">
                  AI Assistant
                </h3>
                <p className="text-xs text-slate-500">
                  Ask about this question
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentMessages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Clear chat">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onToggle(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                title="Close chat">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium mb-1">
                  Need help understanding?
                </p>
                <p className="text-slate-500 text-sm">
                  Ask me anything about this question, the correct answer, or
                  related concepts.
                </p>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-indigo-500 text-white rounded-br-md"
                        : "bg-slate-700 text-slate-100 rounded-bl-md"
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                rows={1}
                className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 max-h-24"
                style={{
                  height: "auto",
                  minHeight: "42px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
