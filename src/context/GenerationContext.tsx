import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  generateQuestions,
  ProgressEvent,
  ProgressCallback,
} from "../backendService";
import { Task } from "../QuestionsTypes";
import { Settings } from "../SettingsType";

export interface GenerationProgressState {
  currentType: string | null;
  currentAttempt: number;
  maxAttempts: number;
  questionsReceived: number;
  questionsTarget: number;
  typeBreakdown: {
    [key: string]: { received: number; target: number; complete: boolean };
  };
  stage: string;
}

export interface StartGenerationParams {
  text: string;
  settings: Settings;
  modelOverride?: string;
  target: number;
}

interface GenerationContextType {
  isGenerating: boolean;
  progress: GenerationProgressState;
  elapsedTime: number;
  error: string | null;
  start: (params: StartGenerationParams) => void;
  cancel: () => void;
  clearError: () => void;
}

const idleProgress = (target = 0): GenerationProgressState => ({
  currentType: null,
  currentAttempt: 0,
  maxAttempts: 3,
  questionsReceived: 0,
  questionsTarget: target,
  typeBreakdown: {},
  stage: "idle",
});

const GenerationContext = createContext<GenerationContextType | null>(null);

export function useGeneration(): GenerationContextType {
  const ctx = useContext(GenerationContext);
  if (!ctx)
    throw new Error("useGeneration must be used within a GenerationProvider");
  return ctx;
}

interface GenerationProviderProps {
  setTasks: (tasks: Task[]) => void;
  children: ReactNode;
}

// Holds quiz generation in app-level state so it keeps running across page
// navigation (only unmounts when the whole app/tab closes). Renders a global
// "quiz ready" toast when generation finishes.
export function GenerationProvider({
  setTasks,
  children,
}: GenerationProviderProps) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressState>(
    idleProgress(),
  );
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState<number | null>(null);
  // Monotonic id: bumping it invalidates an in-flight run (used for cancel).
  const runIdRef = useRef(0);

  // Tick the elapsed timer while generating.
  useEffect(() => {
    if (!isGenerating || startTime === null) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  const start = useCallback(
    (params: StartGenerationParams) => {
      if (isGenerating) return;
      const runId = ++runIdRef.current;
      setIsGenerating(true);
      setError(null);
      setReadyCount(null);
      setStartTime(Date.now());
      setProgress({ ...idleProgress(params.target), stage: "init" });

      const onProgress: ProgressCallback = (event: ProgressEvent) => {
        if (runId !== runIdRef.current) return; // cancelled / superseded
        setProgress((prev) => {
          const next = { ...prev };
          switch (event.stage) {
            case "init":
              next.stage = "init";
              break;
            case "attempt_start":
              next.currentType = event.typeName ?? null;
              next.currentAttempt = event.attempt ?? 0;
              next.stage = "generating";
              break;
            case "questions_received":
              next.questionsReceived = event.total ?? prev.questionsReceived;
              if (event.typeName) {
                next.typeBreakdown[event.typeName] = {
                  received: event.total ?? 0,
                  target: event.target ?? 0,
                  complete: (event.total ?? 0) >= (event.target ?? 0),
                };
              }
              break;
            case "type_complete":
              if (event.typeName) {
                next.typeBreakdown[event.typeName] = {
                  received: event.total ?? 0,
                  target: event.target ?? 0,
                  complete: true,
                };
              }
              break;
            case "all_complete":
              next.stage = "complete";
              break;
          }
          return next;
        });
      };

      void (async () => {
        try {
          const result = await generateQuestions(
            params.text,
            params.settings,
            onProgress,
            params.modelOverride,
          );
          if (runId !== runIdRef.current) return; // cancelled while running
          if (!result || result.length === 0) {
            setError("No questions were generated. Please try with different text.");
            return;
          }
          setTasks(result);
          setReadyCount(result.length);
        } catch (err) {
          if (runId !== runIdRef.current) return;
          setError(
            "Failed to generate questions. Please check your API key and try again.",
          );
          console.error("Error generating questions:", err);
        } finally {
          if (runId === runIdRef.current) {
            setIsGenerating(false);
            setStartTime(null);
          }
        }
      })();
    },
    [isGenerating, setTasks],
  );

  const cancel = useCallback(() => {
    runIdRef.current++; // invalidate the in-flight run
    setIsGenerating(false);
    setStartTime(null);
    setProgress(idleProgress());
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <GenerationContext.Provider
      value={{ isGenerating, progress, elapsedTime, error, start, cancel, clearError }}
    >
      {children}
      {readyCount !== null && (
        <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-slate-800 px-4 py-3 shadow-2xl shadow-black/40">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">Quiz ready</p>
              <p className="text-xs text-slate-400">
                {readyCount} question{readyCount === 1 ? "" : "s"} generated
              </p>
            </div>
            <button
              onClick={() => {
                setReadyCount(null);
                navigate("/quizPage");
              }}
              className="ml-1 shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
            >
              Start
            </button>
            <button
              onClick={() => setReadyCount(null)}
              aria-label="Dismiss"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </GenerationContext.Provider>
  );
}
