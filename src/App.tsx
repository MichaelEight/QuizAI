import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router";
import SourceTextPage from "./SourceTextPage";
import SettingsPage from "./SettingsPage";
import QuizPage from "./QuizPage";
import AchievementsPage from "./AchievementsPage";
import LibraryPage from "./LibraryPage";
import Homepage from "./Homepage";
import UsagePage from "./UsagePage";
import { Settings } from "./SettingsType";
import { Task } from "./QuestionsTypes";
import { UploadedFile } from "./services/fileExtractService";
import { ApiKeyProvider, useApiKey } from "./context/ApiKeyContext";
import { GamificationProvider } from "./context/GamificationContext";
import { QuizLibraryProvider } from "./context/QuizLibraryContext";
import { SaveQuizModalProvider } from "./context/SaveQuizModalContext";
import { UsageProvider } from "./context/UsageContext";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { AiWelcomeModal } from "./components/AiWelcomeModal";
import { ApiKeyButton } from "./components/ApiKeyButton";
import { AiModelButton } from "./components/AiModelButton";
import { AiModelModal } from "./components/AiModelModal";
import { getSelectedModel, setGlobalModel, MODELS, ModelId } from "./services/constants";
import { ImportExportButton } from "./components/ImportExportButton";
import { ImportExportModal } from "./components/ImportExportModal";
import { SaveQuizModal } from "./components/SaveQuizModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { GenerationProvider } from "./context/GenerationContext";
import { useFastTooltips } from "./hooks/useFastTooltips";
import { version } from "../package.json";
import "./App.css";

const STORAGE_KEYS = {
  SETTINGS: "quizai_settings",
  SOURCE_TEXT: "quizai_source_text",
  TASKS: "quizai_tasks",
  UPLOADED_FILES: "quizai_uploaded_files",
} as const;

const DEFAULT_SETTINGS: Settings = {
  amountOfClosedQuestions: 30,
  amountOfOpenQuestions: 0,
  allowMultipleCorrectAnswers: true,
  forceMultipleCorrectAnswers: false,
  minAnswersPerQuestion: 4,
  maxAnswersPerQuestion: 6,
  defaultPoolSize: 2,
  failedOriginalCopies: 2,
  failedRetryCopies: 1,
  contentFocus: 'important',
  difficultyLevel: 'hard',
  questionStyle: 'conceptual',
  customInstructions: '',
  quizLanguage: 'english',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as T;
      // Validate array types - if default is array, parsed must be array too
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`Expected array for ${key}, got object. Using default.`);
        return defaultValue;
      }
      // Merge with defaults to handle new fields added in updates
      // Only merge plain objects, not arrays
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        return { ...defaultValue, ...parsed };
      }
      return parsed;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/* ----------------------------- Navigation icons ---------------------------- */

type IconProps = { className?: string };

const HomeIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1v-9" />
  </svg>
);

const CreateIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
    <circle cx="12" cy="12" r="3.2" strokeWidth={1.8} />
  </svg>
);

const QuizIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 9.2a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.7v.4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.8 16.6h.01" />
  </svg>
);

const LibraryIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 4.5h3.5v15H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Zm3.5 0H12v15H8.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m13.4 5.2 3.3-.6 2.4 13.4-3.3.6z" />
  </svg>
);

const TrophyIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4.5h10V9a5 5 0 0 1-10 0V4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 6H4.5a2.5 2.5 0 0 0 2.5 2.5M17 6h2.5A2.5 2.5 0 0 1 17 8.5M12 14v3m-3 3h6m-5 0a3 3 0 0 1 4 0" />
  </svg>
);

const UsageIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20h16M7 20v-6m5 6V8m5 12v-9" />
  </svg>
);

const SettingsIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.3A1.6 1.6 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
  </svg>
);

const PlusIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v14M5 12h14" />
  </svg>
);

type NavItem = { to: string; label: string; icon: (p: IconProps) => React.ReactElement; end?: boolean };

// Desktop sidebar order — Settings (tune generation) comes before Create
// (add source), reflecting the create flow.
const STUDY_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "settingsPage", label: "Settings", icon: SettingsIcon },
  { to: "sourcePage", label: "Create", icon: CreateIcon },
  { to: "quizPage", label: "Quiz", icon: QuizIcon },
  { to: "library", label: "Library", icon: LibraryIcon },
];

const PROGRESS_NAV: NavItem[] = [
  { to: "achievements", label: "Achievements", icon: TrophyIcon },
  { to: "usage", label: "Usage", icon: UsageIcon },
];

// Mobile bottom bar — keep to the core destinations (Settings lives in "More").
const TAB_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "sourcePage", label: "Create", icon: CreateIcon },
  { to: "quizPage", label: "Quiz", icon: QuizIcon },
  { to: "library", label: "Library", icon: LibraryIcon },
];

/* ------------------------------- Brand mark -------------------------------- */

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt="QuizAI"
        className="h-9 w-9 shrink-0"
      />
      <div className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight text-slate-100">QuizAI</span>
        <span className="block text-[11px] font-medium text-slate-500">Study smarter</span>
      </div>
    </div>
  );
}

/* ------------------------------ Sidebar link ------------------------------- */

// Small "live" pulse shown on a nav item that points to an in-progress quiz.
function LivePulse() {
  return (
    <span className="relative ml-auto flex h-2.5 w-2.5" aria-label="Quiz in progress" title="Quiz in progress">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

function SidebarLink({ item, onNavigate, indicator }: { item: NavItem; onNavigate?: () => void; indicator?: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-indigo-500/15 text-indigo-300"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
          {item.label}
          {indicator && <LivePulse />}
        </>
      )}
    </NavLink>
  );
}

const QUIZ_PROGRESS_KEY = "quizai_quiz_progress";

function readQuizActive(): boolean {
  try {
    const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as { isQuizStarted?: boolean; isQuizEnded?: boolean };
    return Boolean(p.isQuizStarted) && !p.isQuizEnded;
  } catch {
    return false;
  }
}

function AppContent() {
  const [sourceText, setSourceText] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SOURCE_TEXT, "")
  );
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage(STORAGE_KEYS.TASKS, [])
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() =>
    loadFromStorage(STORAGE_KEYS.UPLOADED_FILES, [])
  );
  const [moreOpen, setMoreOpen] = useState(false);

  // Persist settings to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Persist sourceText to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SOURCE_TEXT, sourceText);
  }, [sourceText]);

  // Persist tasks to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // Persist uploadedFiles to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.UPLOADED_FILES, uploadedFiles);
  }, [uploadedFiles]);

  const { showApiKeyModal, setShowApiKeyModal } = useApiKey();
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [globalModel, setGlobalModelState] = useState<ModelId>(() => getSelectedModel());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("quizai_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  const changeGlobalModel = (id: ModelId) => {
    setGlobalModel(id);
    setGlobalModelState(id);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("quizai_sidebar_collapsed", next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Enable fast tooltips (500ms delay instead of browser default 2-3s)
  useFastTooltips();

  // Close mobile "More" sheet on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Track whether a quiz is in progress, to highlight the Quiz nav entry.
  const [isQuizActive, setIsQuizActive] = useState<boolean>(() => readQuizActive());
  useEffect(() => {
    const update = () => setIsQuizActive(readQuizActive());
    update();
    window.addEventListener("quizai:quiz-progress", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("quizai:quiz-progress", update);
      window.removeEventListener("storage", update);
    };
  }, [location.pathname]);

  const openImportExport = () => {
    setMoreOpen(false);
    setShowImportExportModal(true);
  };

  // Global keyboard-shortcuts modal, openable from any page (sidebar button,
  // mobile quiz button, or the "?" key on the quiz page).
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  useEffect(() => {
    const open = () => setShowShortcutsModal(true);
    window.addEventListener("quizai:open-shortcuts", open);
    return () => window.removeEventListener("quizai:open-shortcuts", open);
  }, []);

  return (
    <>
      <AiWelcomeModal />
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        allowClose
      />
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        tasks={tasks}
        setTasks={setTasks}
        sourceText={sourceText}
      />
      <SaveQuizModal />
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      <AiModelModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        value={globalModel}
        onChange={changeGlobalModel}
      />

      <GenerationProvider setTasks={setTasks}>
      <div className="min-h-screen overflow-x-clip bg-slate-900 text-slate-100">
        {/* ============================ Desktop sidebar =========================== */}
        <aside
          className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 ${
            sidebarCollapsed ? "lg:-translate-x-full" : ""
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Link to="/" aria-label="QuizAI home">
              <BrandMark />
            </Link>
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="-mr-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m7 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="px-3">
            <Link
              to="sourcePage"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 active:scale-[0.98]"
            >
              <PlusIcon className="h-4.5 w-4.5" />
              New Quiz
            </Link>
            <button
              onClick={() => isQuizActive && window.dispatchEvent(new Event("quizai:end-quiz"))}
              aria-disabled={!isQuizActive}
              title={isQuizActive ? "End current quiz" : "No active quiz"}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isQuizActive
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 active:scale-[0.98]"
                  : "cursor-not-allowed! bg-slate-800/50 text-slate-600"
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End Quiz
            </button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Study</p>
              {STUDY_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} indicator={isQuizActive && item.to === "quizPage"} />
              ))}
            </div>
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Progress</p>
              {PROGRESS_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          </nav>

          <div className="space-y-3 border-t border-slate-800 px-3 py-4">
            <div className="flex flex-col gap-2 px-1">
              <AiModelButton label={MODELS[globalModel]?.label ?? "AI Model"} onClick={() => setShowModelModal(true)} />
              <ApiKeyButton />
              <ImportExportButton onClick={() => setShowImportExportModal(true)} />
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm"
                title="Keyboard shortcuts"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <span className="text-slate-300">Shortcuts</span>
              </button>
            </div>
            <p className="px-3 text-[11px] text-slate-600">v{version}</p>
          </div>
        </aside>

        {/* ============================ Mobile top bar =========================== */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/85 px-4 backdrop-blur-md lg:hidden">
          <Link to="/" aria-label="QuizAI home">
            <BrandMark />
          </Link>
          <ApiKeyButton />
        </header>

        {/* Expand button — shown when the sidebar is collapsed (desktop only) */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="hidden lg:flex fixed left-3 top-3 z-50 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/90 p-2 text-slate-300 shadow-lg backdrop-blur-md transition-colors hover:bg-slate-700 hover:text-slate-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* ============================== Main content =========================== */}
        <div className={`transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-64"}`}>
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
            <Routes>
              <Route
                path="/"
                element={<Homepage setTasks={setTasks} setSourceText={setSourceText} />}
              />
              <Route
                path="settingsPage"
                element={
                  <SettingsPage settings={settings} setSettings={setSettings} />
                }
              />
              <Route
                path="sourcePage"
                element={
                  <SourceTextPage
                    sourceText={sourceText}
                    setSourceText={setSourceText}
                    settings={settings}
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                  />
                }
              />
              <Route
                path="quizPage"
                element={<QuizPage sourceText={sourceText} uploadedFiles={uploadedFiles} tasks={tasks} setTasks={setTasks} settings={settings} />}
              />
              <Route
                path="library"
                element={<LibraryPage setTasks={setTasks} setSourceText={setSourceText} />}
              />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="usage" element={<UsagePage />} />
            </Routes>
          </main>
        </div>

        {/* ============================ Mobile bottom tabs ======================= */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-800 bg-slate-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          {TAB_NAV.map((item) => {
            const Icon = item.icon;
            const showPulse = isQuizActive && item.to === "quizPage";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                    isActive ? "text-indigo-400" : "text-slate-500"
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {showPulse && (
                    <span className="absolute -right-1 -top-0.5 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                </span>
                {item.label}
              </NavLink>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              moreOpen ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
            More
          </button>
        </nav>

        {/* ============================ Mobile "More" sheet ===================== */}
        {moreOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 animate-fade-in rounded-t-2xl border-t border-slate-800 bg-slate-900 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl shadow-black/40">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
              <div className="space-y-1">
                {PROGRESS_NAV.map((item) => (
                  <SidebarLink key={item.to} item={item} onNavigate={() => setMoreOpen(false)} />
                ))}
                <SidebarLink
                  item={{ to: "settingsPage", label: "Settings", icon: SettingsIcon }}
                  onNavigate={() => setMoreOpen(false)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4">
                <AiModelButton
                  label={MODELS[globalModel]?.label ?? "AI Model"}
                  onClick={() => {
                    setMoreOpen(false);
                    setShowModelModal(true);
                  }}
                />
                <ImportExportButton onClick={openImportExport} />
              </div>
            </div>
          </div>
        )}
      </div>
      </GenerationProvider>
    </>
  );
}

function App() {
  return (
    <ApiKeyProvider>
      <UsageProvider>
        <GamificationProvider>
          <QuizLibraryProvider>
            <SaveQuizModalProvider>
              <AppContent />
            </SaveQuizModalProvider>
          </QuizLibraryProvider>
        </GamificationProvider>
      </UsageProvider>
    </ApiKeyProvider>
  );
}

export default App;
