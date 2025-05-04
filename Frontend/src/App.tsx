import { useState } from "react";
import { Routes, Route, NavLink } from "react-router";
import SourceTextPage from "./SourceTextPage";
import SettingsPage from "./SettingsPage";
import QuizPage from "./QuizPage";
import Homepage from "./Homepage";
import { Settings } from "./SettingsType";
import { Task } from "./QuestionsTypes";
import "./App.css";

function App() {
  const [sourceText, setSourceText] = useState("");
  const [settings, setSettings] = useState<Settings>({
    amountOfClosedQuestions: 2,
    amountOfOpenQuestions: 1,
    allowMultipleCorrectAnswers: false,
    forceMultipleCorrectAnswers: false,
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div className="main-container">
      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="settingsPage" end>
          Settings
        </NavLink>
        <NavLink to="sourcePage" end>
          Input Text
        </NavLink>
        <NavLink to="quizPage" end>
          Quiz
        </NavLink>
      </nav>

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
            />
          }
        />
        <Route path="quizPage" element={<QuizPage tasks={tasks} />} />
      </Routes>
    </div>
  );
}

export default App;
