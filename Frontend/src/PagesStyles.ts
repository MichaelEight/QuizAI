// Dark theme styles for QuizAI

export const styles = {
  // Cards
  card: "bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20",
  cardHover: "bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 transition-all duration-200 hover:bg-slate-750 hover:-translate-y-0.5 hover:shadow-xl",

  // Page headers
  pageHeader: "text-3xl font-bold text-slate-100 mb-2",
  pageSubheader: "text-slate-400 mb-8",

  // Section headers
  sectionHeader: "text-xl font-semibold text-slate-100 mb-4",

  // Buttons
  buttonPrimary: "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-500",
  buttonSecondary: "bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 font-medium rounded-lg px-6 py-3 transition-all duration-200 active:scale-[0.98]",
  buttonGhost: "bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-100 font-medium rounded-lg px-4 py-2 transition-all duration-200",
  buttonDanger: "bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 active:scale-[0.98]",

  // Inputs
  input: "w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
  textarea: "w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none",
  inputLabel: "block text-sm font-medium text-slate-300 mb-2",

  // Toggle switch
  toggle: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
  toggleEnabled: "bg-indigo-500",
  toggleDisabled: "bg-slate-600",
  toggleKnob: "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200",
  toggleKnobEnabled: "translate-x-6",
  toggleKnobDisabled: "translate-x-1",

  // Number input
  numberInput: "w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-center transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",

  // Text
  textPrimary: "text-slate-100",
  textSecondary: "text-slate-400",
  textMuted: "text-slate-500",
};

// Quiz-specific styles
export const quizPageStyles = {
  // Headers
  pageHeader: "text-3xl font-bold text-slate-100 mb-2",
  questionHeader: "text-2xl font-bold text-slate-100",
  questionNumber: "inline-flex items-center justify-center w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-semibold mr-3",

  // Progress bar
  progressContainer: "w-full bg-slate-700 rounded-full h-2 mb-8",
  progressBar: "bg-indigo-500 h-2 rounded-full transition-all duration-300",

  // Question card
  questionCard: "bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-black/20 mb-6",

  // Answer buttons base
  answerButton: "w-full border-2 rounded-xl p-4 text-left transition-all duration-200 font-medium",

  // Answer states
  answerDefault: "bg-slate-800 border-slate-600 text-slate-100 hover:border-slate-500 hover:bg-slate-750 hover:-translate-y-0.5",
  answerSelected: "bg-indigo-500/20 border-indigo-500 text-slate-100",
  answerCorrect: "bg-emerald-500/20 border-emerald-500 text-emerald-400",
  answerWrong: "bg-rose-500/20 border-rose-500 text-rose-400",
  answerDisabled: "opacity-60 cursor-not-allowed",

  // Action buttons
  actionButton: "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98]",
  actionButtonPrimary: "bg-indigo-500 hover:bg-indigo-400 text-white",
  actionButtonSecondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
  actionButtonDisabled: "bg-slate-700/50 text-slate-500 cursor-not-allowed hover:bg-slate-700/50",

  // Legacy compatibility (mapped to new styles)
  defaultActionButton: "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
  notSelectedAnswerButton: "bg-slate-800 border-slate-600 text-slate-100 hover:border-slate-500 hover:bg-slate-750",
  selectedAnswerButton: "bg-indigo-500/20 border-indigo-500 text-slate-100",
  enabledActionButton: "bg-indigo-500 hover:bg-indigo-400 text-white",
  disabledActionButton: "bg-slate-700/50 text-slate-500 cursor-not-allowed",

  // Open answer
  openAnswerTextarea: "w-full h-40 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none",

  // Score display
  scoreCard: "bg-slate-800 border border-slate-700 rounded-xl p-8 text-center",
  scoreLabel: "text-slate-400 text-lg mb-2",
  scoreValue: "text-5xl font-bold text-indigo-400",

  // Results
  resultCorrect: "text-emerald-400",
  resultWrong: "text-rose-400",
};
