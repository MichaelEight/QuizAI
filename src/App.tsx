import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router";
import SourceTextPage from "./SourceTextPage";
import SettingsPage from "./SettingsPage";
import QuizPage from "./QuizPage";
import AchievementsPage from "./AchievementsPage";
import LibraryPage from "./LibraryPage";
import Homepage from "./Homepage";
import AuthCallbackPage from "./AuthCallbackPage";
import { Settings } from "./SettingsType";
import { Task } from "./QuestionsTypes";
import { UploadedFile } from "./services/fileExtractService";
import { ApiKeyProvider, useApiKey } from "./context/ApiKeyContext";
import { AuthProvider } from "./context/AuthContext";
import { GamificationProvider } from "./context/GamificationContext";
import { QuizLibraryProvider } from "./context/QuizLibraryContext";
import { SaveQuizModalProvider } from "./context/SaveQuizModalContext";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { ApiKeyButton } from "./components/ApiKeyButton";
import { LoginButton } from "./components/LoginButton";
import { UserMenu } from "./components/UserMenu";
import { ImportExportButton } from "./components/ImportExportButton";
import { ImportExportModal } from "./components/ImportExportModal";
import { SaveQuizModal } from "./components/SaveQuizModal";
import { version } from "../package.json";
import "./App.css";

const STORAGE_KEYS = {
  SETTINGS: "quizai_settings",
  SOURCE_TEXT: "quizai_source_text",
  TASKS: "quizai_tasks",
  UPLOADED_FILES: "quizai_uploaded_files",
} as const;

const DEFAULT_SETTINGS: Settings = {
  amountOfClosedQuestions: 2,
  amountOfOpenQuestions: 1,
  allowMultipleCorrectAnswers: false,
  forceMultipleCorrectAnswers: false,
  minAnswersPerQuestion: 4,
  maxAnswersPerQuestion: 4,
  defaultPoolSize: 2,
  failedOriginalCopies: 3,
  failedRetryCopies: 2,
  contentFocus: 'important',
  difficultyLevel: 'mixed',
  questionStyle: 'conceptual',
  customInstructions: '',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const { showApiKeyModal, setShowApiKeyModal, hasApiKey } = useApiKey();
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        tasks={tasks}
        setTasks={setTasks}
        sourceText={sourceText}
      />
      <SaveQuizModal />
      <div className="min-h-screen bg-slate-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-md border-b border-slate-700">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <img src="/favicon.svg" alt="QuizAI" className="w-8 h-8" />
                <span className="text-slate-100 font-semibold text-lg">QuizAI</span>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass} title="Home">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </NavLink>
                <NavLink to="settingsPage" end className={navLinkClass} title="Settings">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </NavLink>
                <NavLink to="sourcePage" end className={navLinkClass} title="Input Text">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </NavLink>
                <NavLink to="quizPage" end className={navLinkClass} title="Quiz">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </NavLink>
                <NavLink to="library" end className={navLinkClass} title="Library">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </NavLink>
                <NavLink to="achievements" end className={navLinkClass} title="Achievements">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                </NavLink>
              </div>

              {/* Right side: Desktop toolbar + Mobile hamburger */}
              <div className="flex items-center gap-2">
                {/* Desktop toolbar buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <ImportExportButton onClick={() => setShowImportExportModal(true)} />
                  <ApiKeyButton />
                  <LoginButton />
                  <UserMenu />
                </div>

                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 bg-slate-800/95 backdrop-blur-md animate-fade-in">
              <div className="px-4 py-3 space-y-1">
                <NavLink to="/" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`}>
                  Home
                </NavLink>
                <NavLink to="settingsPage" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`}>
                  Settings
                </NavLink>
                <NavLink to="sourcePage" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`}>
                  Input Text
                </NavLink>
                <NavLink to="quizPage" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`}>
                  Quiz
                </NavLink>
                <NavLink to="library" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Library
                  </span>
                </NavLink>
                <NavLink to="achievements" end className={({ isActive }) => `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-indigo-500/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700/50"}`} title="Achievements">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                    Achievements
                  </span>
                </NavLink>

                {/* Mobile toolbar buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-700">
                  <ImportExportButton onClick={() => setShowImportExportModal(true)} />
                  <ApiKeyButton />
                  <LoginButton />
                  <UserMenu />
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
    <AuthProvider>
      <ApiKeyProvider>
        <GamificationProvider>
          <QuizLibraryProvider>
            <SaveQuizModalProvider>
              <AppContent />
            </SaveQuizModalProvider>
          </QuizLibraryProvider>
        </GamificationProvider>
      </ApiKeyProvider>
    </AuthProvider>
  );
}

export default App;
