import { Answer, Task } from "./QuestionsTypes";

interface AnswerFieldProps {
  openAnswer: string;
  setOpenAnswer: (answer: string) => void;
  currentTask: Task;
  setCurrentTask: (task: Task) => void;
  areAnswersChecked: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
}

export default function AnswerField({
  openAnswer,
  setOpenAnswer,
  currentTask,
  setCurrentTask,
  areAnswersChecked,
  inputRef,
  onInputFocus,
  onInputBlur,
}: AnswerFieldProps) {
  return currentTask.question.isOpen ? (
    <OpenAnswer
      openAnswer={openAnswer}
      setOpenAnswer={setOpenAnswer}
      areAnswersChecked={areAnswersChecked}
      inputRef={inputRef}
      onFocus={onInputFocus}
      onBlur={onInputBlur}
    />
  ) : (
    <ClosedAnswer
      currentTask={currentTask}
      setCurrentTask={setCurrentTask}
      areAnswersChecked={areAnswersChecked}
    />
  );
}

interface OpenAnswerProps {
  openAnswer: string;
  setOpenAnswer: (answer: string) => void;
  areAnswersChecked: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onFocus?: () => void;
  onBlur?: () => void;
}

function OpenAnswer({ openAnswer, setOpenAnswer, areAnswersChecked, inputRef, onFocus, onBlur }: OpenAnswerProps) {
  const handleOpenAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOpenAnswer(e.target.value);
  };

  return (
    <div>
      <label htmlFor="openAnswer" className="block text-sm font-medium text-slate-500 mb-2">
        Your Answer
      </label>
      <textarea
        ref={inputRef}
        id="openAnswer"
        className={`w-full h-32 bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 resize-none ${
          areAnswersChecked
            ? "border-slate-300 opacity-75 cursor-not-allowed"
            : "border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        }`}
        placeholder="Type your answer here..."
        value={openAnswer}
        onChange={handleOpenAnswerChange}
        disabled={areAnswersChecked}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus
      />
      <div className="flex justify-end mt-2">
        <span className="text-sm text-slate-400">{openAnswer.length} characters</span>
      </div>
    </div>
  );
}

interface ClosedAnswerProps {
  currentTask: Task;
  setCurrentTask: (task: Task) => void;
  areAnswersChecked: boolean;
}

function ClosedAnswer({ currentTask, setCurrentTask, areAnswersChecked }: ClosedAnswerProps) {
  const handleAnswerClick = (index: number) => {
    if (!currentTask?.answers) return;
    if (areAnswersChecked) return;

    const updatedAnswers = currentTask.answers.map((answer: Answer, i: number) =>
      i === index ? { ...answer, isSelected: !answer.isSelected } : answer,
    );

    setCurrentTask({ ...currentTask, answers: updatedAnswers });
  };

  const getAnswerStyles = (answer: Answer) => {
    const base = "w-full border-2 rounded-xl p-4 text-left transition-all duration-200 font-medium";

    if (areAnswersChecked) {
      // After checking - show correct/incorrect states
      if (answer.isCorrect) {
        return `${base} bg-emerald-50 border-emerald-500 text-emerald-600`;
      } else if (answer.isSelected && !answer.isCorrect) {
        return `${base} bg-rose-50 border-rose-500 text-rose-600`;
      } else {
        return `${base} bg-white border-slate-200 text-slate-500 opacity-60`;
      }
    }

    // Before checking - show selection states
    if (answer.isSelected) {
      return `${base} bg-indigo-50 border-indigo-500 text-slate-900`;
    }

    return `${base} bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:bg-slate-100 hover:-translate-y-0.5 cursor-pointer`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {currentTask.answers?.map((answer: Answer, index: number) => (
        <button
          key={`${currentTask.question.value}-${answer.value}-${index}`}
          className={getAnswerStyles(answer)}
          onClick={() => handleAnswerClick(index)}
          disabled={areAnswersChecked}
        >
          <div className="flex items-center gap-3">
            {/* Selection indicator */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              areAnswersChecked
                ? answer.isCorrect
                  ? "border-emerald-500 bg-emerald-600"
                  : answer.isSelected
                  ? "border-rose-500 bg-rose-600"
                  : "border-slate-300"
                : answer.isSelected
                ? "border-indigo-500 bg-indigo-600"
                : "border-slate-300"
            }`}>
              {(answer.isSelected || (areAnswersChecked && answer.isCorrect)) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>{answer.value}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
