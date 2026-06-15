import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  sendChatMessage,
  ChatMessage,
  ChatContext,
  loadChatCache,
  saveChatCache,
  expandMessage,
  getMentionNames,
  SLASH_COMMANDS,
} from "../services/chatService";
import { Markdown } from "./Markdown";
import { useApiKey } from "../context/ApiKeyContext";

interface QuizChatBotProps {
  readonly context: ChatContext;
  readonly questionId: string;
  readonly isOpen: boolean;
  readonly onToggle: (open: boolean) => void;
  readonly quizKey: string; // tasks hash — scopes the cached chat to this quiz
  readonly aiEnabled?: boolean; // false → show locked panel instead of chat
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
  quizKey,
  aiEnabled = true,
}: Readonly<QuizChatBotProps>) {
  const { setShowApiKeyModal } = useApiKey();
  // Restore cached chat for the current quiz (survives page reloads).
  const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(
    () => new Map(Object.entries(loadChatCache(quizKey))),
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  // Autocomplete for @mentions and /commands, + a help popover.
  const [suggest, setSuggest] = useState<{
    trigger: "@" | "/";
    query: string;
    start: number;
  } | null>(null);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Element that had focus before the chat opened, to restore on close.
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get messages for current question
  const currentMessages = messages.get(questionId) || [];

  // Persist chat whenever it changes, scoped to the current quiz.
  useEffect(() => {
    saveChatCache(quizKey, Object.fromEntries(messages));
  }, [messages, quizKey]);

  // Loading a different quiz swaps in that quiz's cached chat (empty if none).
  useEffect(() => {
    setMessages(new Map(Object.entries(loadChatCache(quizKey))));
  }, [quizKey]);

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

  // On open: remember what was focused. On close: restore that focus.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = (document.activeElement as HTMLElement) || null;
    } else if (previousFocusRef.current) {
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (typeof prev.focus === "function" && document.contains(prev)) {
        prev.focus();
      }
    }
  }, [isOpen]);

  // Move focus into the chat input once the window has actually mounted
  // (it renders a frame after isOpen flips, behind the open animation).
  useEffect(() => {
    if (isOpen && shouldRender) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen, shouldRender]);

  const handleSend = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Expand /slash commands and @mentions before sending.
    const content = expandMessage(trimmedInput, context);

    setError(null);
    setInputValue("");

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content,
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
        content,
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

  // Suggestions for the @ / token currently being typed.
  const suggestItems: Array<{ value: string; desc?: string }> = (() => {
    if (!suggest) return [];
    if (suggest.trigger === "@") {
      return getMentionNames(context)
        .filter((n) => n.toLowerCase().startsWith(suggest.query.toLowerCase()))
        .map((n) => ({ value: n }));
    }
    return SLASH_COMMANDS.filter((c) =>
      c.cmd.startsWith(suggest.query.toLowerCase()),
    ).map((c) => ({ value: c.cmd, desc: c.description }));
  })();

  // Detect a trigger token (@x, or leading /x) right before the caret.
  const updateSuggest = (value: string, caret: number) => {
    const before = value.slice(0, caret);
    const m = before.match(/(^|\s)([@/])(\w*)$/);
    if (m) {
      const trigger = m[2] as "@" | "/";
      const query = m[3];
      const start = caret - query.length - 1;
      if (trigger === "/" && start !== 0) {
        setSuggest(null); // slash commands only at the start of the message
        return;
      }
      setSuggest({ trigger, query, start });
      setSuggestIndex(0);
    } else {
      setSuggest(null);
    }
  };

  const applySuggestion = (val: string) => {
    if (!suggest) return;
    const tokenEnd = suggest.start + 1 + suggest.query.length;
    const insert = `${suggest.trigger}${val} `;
    const next =
      inputValue.slice(0, suggest.start) + insert + inputValue.slice(tokenEnd);
    setInputValue(next);
    setSuggest(null);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        const pos = suggest.start + insert.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggest && suggestItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestIndex((i) => (i + 1) % suggestItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestIndex(
          (i) => (i - 1 + suggestItems.length) % suggestItems.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const pick = suggestItems[suggestIndex] ?? suggestItems[0];
        applySuggestion(pick.value);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggest(null);
        return;
      }
    }
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
        style={{ position: "fixed", right: "1rem", zIndex: 9999 }}
        className={`bottom-20 lg:bottom-4 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
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
          style={{ position: "fixed", right: "1rem", zIndex: 9999 }}
          className={`bottom-36 lg:bottom-20 w-96 max-w-[calc(100vw-2rem)] h-[700px] max-h-[calc(100vh-12rem)] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
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
              <button
                onClick={() => setShowHelp((v) => !v)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showHelp
                    ? "text-indigo-400 bg-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
                title="Commands help">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={1.6} />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.6 9.4a2.4 2.4 0 1 1 3.2 2.3c-.7.3-1.3.9-1.3 1.7v.3m0 2.6h.01"
                  />
                </svg>
              </button>
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

          {!aiEnabled ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
                <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="mb-1 font-medium text-slate-100">AI chat is locked</p>
              <p className="mb-4 text-sm text-slate-400">
                Add an OpenAI API key to ask the assistant about this question.
              </p>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-400 active:scale-[0.98]"
              >
                Add API Key
              </button>
            </div>
          ) : (
            <>
          {/* Commands help popover */}
          {showHelp && (
            <div className="absolute right-3 top-14 z-20 w-72 rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm shadow-xl">
              <p className="mb-1 font-medium text-slate-200">Slash commands</p>
              <ul className="mb-3 space-y-1">
                {SLASH_COMMANDS.map((c) => (
                  <li key={c.cmd} className="text-slate-400">
                    <span className="font-mono text-indigo-300">/{c.cmd}</span> — {c.description}
                  </li>
                ))}
              </ul>
              <p className="mb-1 font-medium text-slate-200">
                Mentions{" "}
                <span className="font-normal text-slate-400">(insert the referenced text)</span>
              </p>
              <p className="font-mono text-xs text-indigo-300">
                @question @hint @explanation @answer1 …
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Type <span className="font-mono">/</span> or{" "}
                <span className="font-mono">@</span> in the box for suggestions.
              </p>
            </div>
          )}

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
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <Markdown content={msg.content} className="text-sm" />
                    )}
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
          <div className="relative p-3 bg-slate-800 border-t border-slate-700">
            {/* Autocomplete for @mentions / slash commands */}
            {suggest && suggestItems.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-2 max-h-48 overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 shadow-xl">
                {suggestItems.map((item, i) => (
                  <button
                    key={item.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(item.value);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      i === Math.min(suggestIndex, suggestItems.length - 1)
                        ? "bg-indigo-500/20"
                        : "hover:bg-slate-700"
                    }`}>
                    <span className="font-mono text-indigo-300">
                      {suggest.trigger}
                      {item.value}
                    </span>
                    {item.desc && (
                      <span className="truncate text-xs text-slate-400">
                        {item.desc}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  updateSuggest(
                    e.target.value,
                    e.target.selectionStart ?? e.target.value.length,
                  );
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask, or type / and @ for commands..."
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
            </>
          )}
        </div>
      )}
    </>,
    document.body,
  );
}
