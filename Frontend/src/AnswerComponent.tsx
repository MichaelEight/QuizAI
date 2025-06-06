import { Answer, Task } from "./QuestionsTypes";
import { quizPageStyles } from "./PagesStyles"; // TODO: Extract answers-only styles

export default function AnswerField({
  openAnswer,
  setOpenAnswer,
  currentTask,
  setCurrentTask,
  areAnswersChecked,
}) {
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

function OpenAnswer({ openAnswer, setOpenAnswer }) {
  const handleOpenAnswerChange = (e) => {
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

function ClosedAnswer({ currentTask, setCurrentTask, areAnswersChecked }) {
  const handleAnswerClick = (index: number) => {
    if (!currentTask?.answers) return;
    if (areAnswersChecked) return;

    // Create a new copy of the answers array
    const updatedAnswers = currentTask.answers.map((answer, i) =>
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
