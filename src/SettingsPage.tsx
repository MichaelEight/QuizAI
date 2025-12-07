import React from "react";
import { Settings, SettingsTypes, ContentFocus, DifficultyLevel } from "./SettingsType";

// Example data for live preview
const SAMPLE_TEXT = `Photosynthesis is the process by which plants convert sunlight into chemical energy. This process occurs primarily in the chloroplasts, where chlorophyll absorbs light. Dr. Jan Ingenhousz first described this process in 1779 during his stay in Vienna. The reaction produces glucose and oxygen as byproducts, which are essential for most life on Earth.`;

interface ExampleQuestion {
  question: string;
  answers: [string, string]; // [correct, incorrect]
}

const EXAMPLE_QUESTIONS: Record<ContentFocus, Record<DifficultyLevel, ExampleQuestion>> = {
  all: {
    easy: {
      question: "In what year was photosynthesis first described?",
      answers: ["1779", "1879"],
    },
    medium: {
      question: "Where was Dr. Ingenhousz when he described photosynthesis?",
      answers: ["Vienna", "London"],
    },
    hard: {
      question: "How did Ingenhousz's historical discovery contribute to our understanding of plant metabolism?",
      answers: ["It established the link between light and plant energy production", "It proved plants only need water"],
    },
    mixed: {
      question: "Who first described the process of photosynthesis?",
      answers: ["Dr. Jan Ingenhousz", "Charles Darwin"],
    },
  },
  important: {
    easy: {
      question: "What do plants convert sunlight into?",
      answers: ["Chemical energy", "Heat energy"],
    },
    medium: {
      question: "What role do chloroplasts play in photosynthesis?",
      answers: ["They contain chlorophyll that absorbs light", "They store glucose"],
    },
    hard: {
      question: "Why are glucose and oxygen, the byproducts of photosynthesis, essential for most life on Earth?",
      answers: ["Glucose provides energy for organisms, oxygen enables respiration", "They create the atmosphere"],
    },
    mixed: {
      question: "What does chlorophyll do during photosynthesis?",
      answers: ["Absorbs light", "Produces water"],
    },
  },
};

// Default values for each section
const DEFAULT_QUESTION_AMOUNTS = {
  amountOfClosedQuestions: 2,
  amountOfOpenQuestions: 1,
};

const DEFAULT_QUESTION_OPTIONS = {
  allowMultipleCorrectAnswers: false,
  forceMultipleCorrectAnswers: false,
};

const DEFAULT_LEARNING_POOL = {
  defaultPoolSize: 2,
  failedOriginalCopies: 3,
  failedRetryCopies: 2,
};

const DEFAULT_GENERATION_OPTIONS = {
  contentFocus: 'important' as ContentFocus,
  difficultyLevel: 'mixed' as DifficultyLevel,
  customInstructions: '',
};

const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_QUESTION_AMOUNTS,
  ...DEFAULT_QUESTION_OPTIONS,
  ...DEFAULT_LEARNING_POOL,
  ...DEFAULT_GENERATION_OPTIONS,
};

interface SettingsPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export default function SettingsPage({ settings, setSettings }: SettingsPageProps) {
  const handleChange = (key: keyof Settings, value: SettingsTypes) => {
    setSettings((prevSettings: Settings) => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const resetQuestionAmounts = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULT_QUESTION_AMOUNTS }));
  };

  const resetQuestionOptions = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULT_QUESTION_OPTIONS }));
  };

  const resetLearningPool = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULT_LEARNING_POOL }));
  };

  const resetGenerationOptions = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULT_GENERATION_OPTIONS }));
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-400">Configure your quiz generation preferences</p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset All
        </button>
      </div>

      {/* Settings Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
        {/* Question Amounts Section */}
        <div className="p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Amounts"
            description="Set how many questions to generate"
            onReset={resetQuestionAmounts}
          />

          <div className="space-y-4">
            <NumberSetting
              label="Closed Questions"
              description="Multiple choice questions with 4 options"
              value={settings.amountOfClosedQuestions}
              onChange={(value) => handleChange("amountOfClosedQuestions", value)}
              min={0}
              max={100}
            />

            <NumberSetting
              label="Open Questions"
              description="Free-form text answer questions"
              value={settings.amountOfOpenQuestions}
              onChange={(value) => handleChange("amountOfOpenQuestions", value)}
              min={0}
              max={100}
            />
          </div>
        </div>

        {/* Question Options Section */}
        <div className="p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Options"
            description="Configure closed question behavior"
            onReset={resetQuestionOptions}
          />

          <div className="space-y-4">
            <ToggleSetting
              label="Allow Multiple Correct Answers"
              description="Some questions may have more than one correct answer"
              checked={settings.allowMultipleCorrectAnswers}
              onChange={(checked) => handleChange("allowMultipleCorrectAnswers", checked)}
            />

            <ToggleSetting
              label="Force Multiple Correct Answers"
              description="All closed questions will have multiple correct answers"
              checked={settings.forceMultipleCorrectAnswers}
              onChange={(checked) => handleChange("forceMultipleCorrectAnswers", checked)}
              disabled={!settings.allowMultipleCorrectAnswers}
            />
          </div>
        </div>

        {/* Question Generation Section */}
        <div className="p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Generation"
            description="Control AI question generation behavior"
            onReset={resetGenerationOptions}
          />

          <div className="space-y-4">
            <SelectSetting
              label="Content Focus"
              description="What content should the AI prioritize"
              value={settings.contentFocus}
              onChange={(value) => handleChange("contentFocus", value)}
              options={[
                { value: 'all', label: 'All content', description: 'Generate from entire text equally' },
                { value: 'important', label: 'Important content only', description: 'Focus on key concepts, skip filler' },
              ]}
            />

            <SelectSetting
              label="Difficulty Level"
              description="How challenging should the questions be"
              value={settings.difficultyLevel}
              onChange={(value) => handleChange("difficultyLevel", value)}
              options={[
                { value: 'mixed', label: 'Mixed', description: 'Variety of difficulties' },
                { value: 'easy', label: 'Easy', description: 'Basic recall and definitions' },
                { value: 'medium', label: 'Medium', description: 'Understanding and relationships' },
                { value: 'hard', label: 'Hard', description: 'Analysis and application' },
              ]}
            />

            <TextareaSetting
              label="Custom Instructions"
              description="Add specific instructions for question generation"
              value={settings.customInstructions}
              onChange={(value) => handleChange("customInstructions", value)}
              placeholder="e.g., Focus on Chapter 3, avoid dates, ask about practical applications..."
            />
          </div>

          {/* Example Preview */}
          <ExamplePreview
            contentFocus={settings.contentFocus}
            difficultyLevel={settings.difficultyLevel}
          />
        </div>

        {/* Pool Settings Section */}
        <div className="p-6">
          <SectionHeader
            title="Learning Pool"
            description="Configure spaced repetition behavior"
            onReset={resetLearningPool}
          />

          <div className="space-y-4">
            <NumberSetting
              label="Initial Copies"
              description="Copies of each question in the starting pool"
              value={settings.defaultPoolSize}
              onChange={(value) => handleChange("defaultPoolSize", value)}
              min={1}
              max={5}
            />

            <NumberSetting
              label="Failed (First Attempt)"
              description="Copies added when failing a fresh question"
              value={settings.failedOriginalCopies}
              onChange={(value) => handleChange("failedOriginalCopies", value)}
              min={1}
              max={5}
            />

            <NumberSetting
              label="Failed (Retry)"
              description="Copies added when failing a repeated question"
              value={settings.failedRetryCopies}
              onChange={(value) => handleChange("failedRetryCopies", value)}
              min={1}
              max={5}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-400">
          <span className="text-slate-300 font-medium">Preview:</span> Your quiz will have{" "}
          <span className="text-indigo-400 font-medium">{settings.amountOfClosedQuestions}</span> closed and{" "}
          <span className="text-indigo-400 font-medium">{settings.amountOfOpenQuestions}</span> open questions.
          {settings.forceMultipleCorrectAnswers
            ? " All closed questions will have multiple correct answers."
            : settings.allowMultipleCorrectAnswers
            ? " Some questions may have multiple correct answers."
            : ""}
        </p>
      </div>
    </div>
  );
}

interface NumberSettingProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberSetting({ label, description, value, onChange, min = 0, max = 100 }: NumberSettingProps) {
  const [inputValue, setInputValue] = React.useState(value.toString());

  // Sync input value when external value changes (e.g., from +/- buttons or reset)
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow empty input while typing
    if (rawValue === '') {
      setInputValue('');
      return;
    }

    // Remove leading zeros (except for standalone "0")
    const cleanedValue = rawValue.replace(/^0+/, '') || '0';
    setInputValue(cleanedValue);

    const newValue = parseInt(cleanedValue, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid value
    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
      setInputValue(min.toString());
      onChange(min);
    } else {
      // Clamp to valid range and update display
      const numValue = parseInt(inputValue, 10);
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setInputValue(clampedValue.toString());
      onChange(clampedValue);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
      <div>
        <p className="text-slate-100 font-medium">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value <= min}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-14 h-8 text-center bg-slate-700 border border-slate-600 rounded-lg text-slate-100 font-medium text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value >= max}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSetting({ label, description, checked, onChange, disabled = false }: ToggleSettingProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-200 ${
        disabled ? "opacity-50" : "hover:bg-slate-700/30"
      }`}
    >
      <div>
        <p className={`font-medium ${disabled ? "text-slate-500" : "text-slate-100"}`}>{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${checked ? "bg-indigo-500" : "bg-slate-600"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
  onReset: () => void;
}

function SectionHeader({ title, description, onReset }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors duration-200"
        title={`Reset ${title} to defaults`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset
      </button>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  description: string;
}

interface SelectSettingProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

function SelectSetting({ label, description, value, onChange, options }: SelectSettingProps) {
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-slate-100 font-medium">{label}</p>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {selectedOption && (
        <p className="text-xs text-slate-500 mt-1">{selectedOption.description}</p>
      )}
    </div>
  );
}

interface TextareaSettingProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextareaSetting({ label, description, value, onChange, placeholder }: TextareaSettingProps) {
  return (
    <div className="py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
      <div className="mb-2">
        <p className="text-slate-100 font-medium">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
      />
    </div>
  );
}

interface ExamplePreviewProps {
  contentFocus: ContentFocus;
  difficultyLevel: DifficultyLevel;
}

function ExamplePreview({ contentFocus, difficultyLevel }: ExamplePreviewProps) {
  // Default to 'important' and 'mixed' if settings are not yet initialized
  const focus = contentFocus || 'important';
  const difficulty = difficultyLevel || 'mixed';
  const example = EXAMPLE_QUESTIONS[focus][difficulty];

  return (
    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
      <p className="text-xs font-medium text-slate-400 mb-2">Example Preview</p>

      {/* Sample text */}
      <p className="text-xs text-slate-500 mb-3 italic leading-relaxed">
        "{SAMPLE_TEXT}"
      </p>

      {/* Example question card */}
      <p className="text-xs text-slate-400 mb-2">With your settings, questions might look like:</p>
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <p className="text-sm text-slate-100 font-medium mb-2">
          {example.question}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">{example.answers[0]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0"></span>
            <span className="text-slate-400">{example.answers[1]}</span>
          </div>
        </div>
      </div>

      {/* Hint about current settings */}
      <p className="text-xs text-slate-500 mt-2">
        {focus === 'important'
          ? "Focusing on core concepts (skipping dates, names)"
          : "Including all details from the text"}
        {" · "}
        {difficulty === 'easy' ? "Basic recall question" :
         difficulty === 'medium' ? "Understanding-based question" :
         difficulty === 'hard' ? "Analysis-level question" :
         "Varied difficulty"}
      </p>
    </div>
  );
}
