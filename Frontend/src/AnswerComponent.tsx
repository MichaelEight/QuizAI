import { Answer, Task } from "./QuestionsTypes";
import { quizPageStyles } from "./PagesStyles"; // TODO: Extract answers-only styles

interface AnswerFieldProps {
  openAnswer: string;
  setOpenAnswer: (answer: string) => void;
  currentTask: Task;
  setCurrentTask: (task: Task) => void;
  areAnswersChecked: boolean;
}

export default function AnswerField({
  openAnswer,
  setOpenAnswer,
  currentTask,
  setCurrentTask,
  areAnswersChecked,
}: AnswerFieldProps) {
  return currentTask.question.isOpen ? (
    <OpenAnswer openAnswer={openAnswer} setOpenAnswer={setOpenAnswer} />
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
}

function OpenAnswer({ openAnswer, setOpenAnswer }: OpenAnswerProps) {
  const handleOpenAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOpenAnswer(e.target.value);
  };

  return (
    <div>
      <textarea
        className="border border-solid border-black"
        rows={5}
        cols={40}
        value={openAnswer}
        onChange={handleOpenAnswerChange}
      />
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

    // Create a new copy of the answers array
    const updatedAnswers = currentTask.answers.map((answer: Answer, i: number) =>
      i === index ? { ...answer, isSelected: !answer.isSelected } : answer,
    );

    // Update the currentTask state with the new answers array
    setCurrentTask({ ...currentTask, answers: updatedAnswers });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {currentTask.answers?.map((answer: Answer, index: number) => (
        <button
          key={`${currentTask.question.value}-${answer.value}`}
          className={`${quizPageStyles.answerButton} ${answer.isSelected ? quizPageStyles.selectedAnswerButton : quizPageStyles.notSelectedAnswerButton}`}
          onClick={() => handleAnswerClick(index)}>
          {answer.value}
        </button>
      ))}
    </div>
  );
}
