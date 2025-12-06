import { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router";
import SourceTextPage from "./SourceTextPage";
import SettingsPage from "./SettingsPage";
import QuizPage from "./QuizPage";
import Homepage from "./Homepage";
import { Settings } from "./SettingsType";
import { Task } from "./QuestionsTypes";
import { ApiKeyProvider, useApiKey } from "./context/ApiKeyContext";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { ApiKeyButton } from "./components/ApiKeyButton";
import { version } from "../package.json";
import "./App.css";

const STORAGE_KEYS = {
  SETTINGS: "quizai_settings",
  SOURCE_TEXT: "quizai_source_text",
  TASKS: "quizai_tasks",
} as const;

const DEFAULT_SETTINGS: Settings = {
  amountOfClosedQuestions: 2,
  amountOfOpenQuestions: 1,
  allowMultipleCorrectAnswers: false,
  forceMultipleCorrectAnswers: false,
  defaultPoolSize: 2,
  failedOriginalCopies: 3,
  failedRetryCopies: 2,
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
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

  const { showApiKeyModal, setShowApiKeyModal, hasApiKey } = useApiKey();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-500/20 text-indigo-400"
        : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
    }`;

  return (
    <>
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        allowClose={hasApiKey}
      />
      <div className="min-h-screen bg-slate-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-md border-b border-slate-700">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="text-slate-100 font-semibold text-lg">QuizAI</span>
              </div>

              {/* Nav Links */}
              <div className="flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  Home
                </NavLink>
                <NavLink to="settingsPage" end className={navLinkClass}>
                  Settings
                </NavLink>
                <NavLink to="sourcePage" end className={navLinkClass}>
                  Input Text
                </NavLink>
                <NavLink to="quizPage" end className={navLinkClass}>
                  Quiz
                </NavLink>
              </div>

              {/* API Key Button */}
              <ApiKeyButton />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Homepage />} />
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
                  setTasks={setTasks}
                  settings={settings}
                />
              }
            />
            <Route
              path="quizPage"
              element={<QuizPage sourceText={sourceText} tasks={tasks} setTasks={setTasks} settings={settings} />}
            />
          </Routes>
        </main>

        {/* Version */}
        <div className="fixed bottom-3 right-4 text-xs text-slate-600">
          v{version}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  );
}

export default App;
