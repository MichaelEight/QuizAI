export const quizPageStyles = {
  pageHeader:
    "mb-6 text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500",

  questionHeader: "font-semibold text-xl mb-4 text-gray-200",

  answerButton:
    "w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 focus:outline-none",

  notSelectedAnswerButton:
    "bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 active:from-gray-900 active:to-gray-800 text-gray-300",

  selectedAnswerButton:
    "bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 active:from-purple-700 active:to-indigo-600 text-white ring-2 ring-offset-2 ring-offset-background ring-purple-400",

  defaultActionButton:
    "px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 active:from-blue-600 active:to-purple-600 shadow-md transition-all duration-300",

  enabledActionButton: "",

  disabledActionButton:
    "px-6 py-3 rounded-full font-semibold text-gray-500 bg-gray-700 cursor-not-allowed opacity-50",
};
