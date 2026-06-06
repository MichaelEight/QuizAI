import React, { useRef } from "react";
import {
  Settings,
  SettingsTypes,
  ContentFocus,
  DifficultyLevel,
  QuestionStyle,
  QuizLanguage,
} from "./SettingsType";
import { SuccessToast } from "./components/SuccessToast";
import { BaseModal } from "./components/BaseModal";

// Example data for live preview
const SAMPLE_TEXT = `Photosynthesis is the process by which plants convert sunlight into chemical energy. This process occurs primarily in the chloroplasts, where chlorophyll absorbs light. Dr. Jan Ingenhousz first described this process in 1779 during his stay in Vienna. The reaction produces glucose and oxygen as byproducts, which are essential for most life on Earth.`;

interface ExampleQuestion {
  question: string;
  answers: [string, string]; // [correct, incorrect]
}

const EXAMPLE_QUESTIONS: Record<
  ContentFocus,
  Record<DifficultyLevel, ExampleQuestion>
> = {
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
      question:
        "How did Ingenhousz's historical discovery contribute to our understanding of plant metabolism?",
      answers: [
        "It established the link between light and plant energy production",
        "It proved plants only need water",
      ],
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
      answers: [
        "They contain chlorophyll that absorbs light",
        "They store glucose",
      ],
    },
    hard: {
      question:
        "Why are glucose and oxygen, the byproducts of photosynthesis, essential for most life on Earth?",
      answers: [
        "Glucose provides energy for organisms, oxygen enables respiration",
        "They create the atmosphere",
      ],
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
  minAnswersPerQuestion: 4,
  maxAnswersPerQuestion: 4,
};

const DEFAULT_LEARNING_POOL = {
  defaultPoolSize: 2,
  failedOriginalCopies: 3,
  failedRetryCopies: 2,
};

const DEFAULT_GENERATION_OPTIONS = {
  contentFocus: "important" as ContentFocus,
  difficultyLevel: "mixed" as DifficultyLevel,
  questionStyle: "conceptual" as QuestionStyle,
  customInstructions: "",
  quizLanguage: "english" as QuizLanguage,
};

const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_QUESTION_AMOUNTS,
  ...DEFAULT_QUESTION_OPTIONS,
  ...DEFAULT_LEARNING_POOL,
  ...DEFAULT_GENERATION_OPTIONS,
};

// Helper Components

function HelpIcon({ tooltip }: { tooltip: string }) {
  return (
    <button
      type="button"
      title={tooltip}
      className="inline-flex items-center justify-center w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-help"
      onClick={(e) => e.preventDefault()}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

function ValidationWarnings({ settings }: { settings: Settings }) {
  const totalQuestions = settings.amountOfClosedQuestions + settings.amountOfOpenQuestions;
  const isHardCombo = settings.forceMultipleCorrectAnswers && settings.difficultyLevel === 'hard';

  if (totalQuestions !== 0 && totalQuestions <= 20 && !isHardCombo) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {totalQuestions === 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-400">
            You need at least one question to generate a quiz
          </p>
        </div>
      )}

      {totalQuestions > 20 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-400">
            Generating {totalQuestions} questions may take several minutes
          </p>
        </div>
      )}

      {isHardCombo && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm text-purple-400">
            This combination creates very challenging quizzes with multiple correct answers
          </p>
        </div>
      )}
    </div>
  );
}

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resetType: 'all' | 'amounts' | 'options' | 'pool' | 'generation' | null;
  currentSettings: Settings;
}

function ResetConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  resetType,
  currentSettings,
}: ResetConfirmationModalProps) {
  const getDefaultForResetType = () => {
    if (resetType === 'all') return DEFAULT_SETTINGS;
    if (resetType === 'amounts') return { ...currentSettings, ...DEFAULT_QUESTION_AMOUNTS };
    if (resetType === 'options') return { ...currentSettings, ...DEFAULT_QUESTION_OPTIONS };
    if (resetType === 'pool') return { ...currentSettings, ...DEFAULT_LEARNING_POOL };
    if (resetType === 'generation') return { ...currentSettings, ...DEFAULT_GENERATION_OPTIONS };
    return currentSettings;
  };

  const getChangedSettings = (): Array<{ label: string; current: string; new: string }> => {
    const defaults = getDefaultForResetType();
    const changes: Array<{ label: string; current: string; new: string }> = [];

    const settingLabels: Record<string, string> = {
      amountOfClosedQuestions: 'Multiple-choice questions',
      amountOfOpenQuestions: 'Free-response questions',
      allowMultipleCorrectAnswers: 'Allow multiple correct',
      forceMultipleCorrectAnswers: 'Force multiple correct',
      minAnswersPerQuestion: 'Min answers per question',
      maxAnswersPerQuestion: 'Max answers per question',
      defaultPoolSize: 'Starting pool size',
      failedOriginalCopies: 'Incorrect on first try',
      failedRetryCopies: 'Incorrect on retry',
      contentFocus: 'Content focus',
      difficultyLevel: 'Difficulty level',
      questionStyle: 'Question style',
      customInstructions: 'Custom instructions',
      quizLanguage: 'Quiz language',
    };

    Object.keys(defaults).forEach((key) => {
      const k = key as keyof Settings;
      if (currentSettings[k] !== defaults[k]) {
        const currentValue = String(currentSettings[k] || '(none)');
        const newValue = String(defaults[k] || '(none)');
        changes.push({
          label: settingLabels[key] || key,
          current: currentValue,
          new: newValue,
        });
      }
    });

    return changes;
  };

  const changes = getChangedSettings();
  const sectionName = resetType === 'all' ? 'All Settings' :
                      resetType === 'amounts' ? 'Question Amounts' :
                      resetType === 'options' ? 'Question Options' :
                      resetType === 'pool' ? 'Learning Pool' :
                      resetType === 'generation' ? 'Question Generation' : 'Section';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Reset {sectionName} to Defaults?
            </h2>
            {changes.length > 0 ? (
              <p className="text-sm text-slate-400">
                The following settings will be changed:
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                These settings are already at their default values.
              </p>
            )}
          </div>
        </div>

        {changes.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            {changes.map((change, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 text-sm border-b border-slate-700/50 last:border-0">
                <span className="text-slate-300">{change.label}</span>
                <span className="text-slate-500 text-right ml-4">
                  {change.current} → <span className="text-indigo-400">{change.new}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors duration-200"
          >
            Reset Settings
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

interface SettingsPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export default function SettingsPage({
  settings,
  setSettings,
}: SettingsPageProps) {
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [resetType, setResetType] = React.useState<'all' | 'amounts' | 'options' | 'pool' | 'generation' | null>(null);
  const saveToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (key: keyof Settings, value: SettingsTypes) => {
    setSettings((prevSettings: Settings) => ({
      ...prevSettings,
      [key]: value,
    }));

    // Debounced toast to avoid spam
    if (saveToastTimeoutRef.current) {
      clearTimeout(saveToastTimeoutRef.current);
    }
    saveToastTimeoutRef.current = setTimeout(() => {
      setSuccessMessage("Settings saved");
    }, 500);
  };

  const resetAll = () => {
    setResetType('all');
    setShowResetModal(true);
  };

  const resetQuestionAmounts = () => {
    setResetType('amounts');
    setShowResetModal(true);
  };

  const resetQuestionOptions = () => {
    setResetType('options');
    setShowResetModal(true);
  };

  const resetLearningPool = () => {
    setResetType('pool');
    setShowResetModal(true);
  };

  const resetGenerationOptions = () => {
    setResetType('generation');
    setShowResetModal(true);
  };

  const confirmReset = () => {
    if (resetType === 'all') {
      setSettings(DEFAULT_SETTINGS);
    } else if (resetType === 'amounts') {
      setSettings((prev) => ({ ...prev, ...DEFAULT_QUESTION_AMOUNTS }));
    } else if (resetType === 'options') {
      setSettings((prev) => ({ ...prev, ...DEFAULT_QUESTION_OPTIONS }));
    } else if (resetType === 'pool') {
      setSettings((prev) => ({ ...prev, ...DEFAULT_LEARNING_POOL }));
    } else if (resetType === 'generation') {
      setSettings((prev) => ({ ...prev, ...DEFAULT_GENERATION_OPTIONS }));
    }

    setShowResetModal(false);
    setSuccessMessage("Settings reset to defaults");
  };

  return (
    <>
      <div className="animate-fade-in max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Configure your quiz generation preferences
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 w-full sm:w-auto">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset All
        </button>
      </div>

      {/* Validation Warnings */}
      <ValidationWarnings settings={settings} />

      {/* Settings Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
        {/* Question Amounts Section */}
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Amounts"
            description="Set how many questions to generate"
            onReset={resetQuestionAmounts}
            helpTooltip="Control how many questions are generated for your quiz. More questions = longer study sessions."
          />

          <div className="space-y-4">
            <NumberSetting
              label="Multiple-Choice Questions"
              description="Questions with answer options. The AI generates distractors based on your content."
              value={settings.amountOfClosedQuestions}
              onChange={(value) =>
                handleChange("amountOfClosedQuestions", value)
              }
              min={0}
              max={100}
            />

            <NumberSetting
              label="Free-Response Questions"
              description="Open-ended questions where you type your answer. Requires more effort but deeper thinking."
              value={settings.amountOfOpenQuestions}
              onChange={(value) => handleChange("amountOfOpenQuestions", value)}
              min={0}
              max={100}
            />
          </div>
        </div>

        {/* Question Options Section */}
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Options"
            description="Configure multiple-choice question behavior"
            onReset={resetQuestionOptions}
            helpTooltip="Configure the structure and difficulty of multiple-choice questions. Multiple correct answers make quizzes more challenging."
          />

          <div className="space-y-4">
            <ToggleSetting
              label="Allow Multiple Correct Answers"
              description="Some questions may have multiple correct answers, making them more challenging"
              checked={settings.allowMultipleCorrectAnswers}
              onChange={(checked) =>
                handleChange("allowMultipleCorrectAnswers", checked)
              }
            />

            <ToggleSetting
              label="Force Multiple Correct Answers"
              description="All questions will require selecting multiple answers (significantly harder difficulty)"
              checked={settings.forceMultipleCorrectAnswers}
              onChange={(checked) =>
                handleChange("forceMultipleCorrectAnswers", checked)
              }
              disabled={!settings.allowMultipleCorrectAnswers}
            />

            <RangeSetting
              label="Answers per Question"
              description="Number of answer options (2-10). More options make questions harder to guess. Most quizzes use 4."
              minValue={settings.minAnswersPerQuestion}
              maxValue={settings.maxAnswersPerQuestion}
              onMinChange={(value) => {
                handleChange("minAnswersPerQuestion", value);
                // Ensure max >= min
                if (value > settings.maxAnswersPerQuestion) {
                  handleChange("maxAnswersPerQuestion", value);
                }
              }}
              onMaxChange={(value) => {
                handleChange("maxAnswersPerQuestion", value);
                // Ensure min <= max
                if (value < settings.minAnswersPerQuestion) {
                  handleChange("minAnswersPerQuestion", value);
                }
              }}
              absoluteMin={2}
              absoluteMax={10}
            />
          </div>
        </div>

        {/* Question Generation Section */}
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <SectionHeader
            title="Question Generation"
            description="Control AI question generation behavior"
            onReset={resetGenerationOptions}
            helpTooltip="Control how the AI generates questions from your content. These settings significantly impact quiz quality and difficulty."
          />

          <div className="space-y-4">
            <SelectSetting
              label="Content Focus"
              description="What content should the AI prioritize"
              value={settings.contentFocus}
              onChange={(value) => handleChange("contentFocus", value)}
              options={[
                {
                  value: "all",
                  label: "All content",
                  description: "Generate from entire text equally",
                },
                {
                  value: "important",
                  label: "Important content only",
                  description: "Focus on key concepts, skip filler",
                },
              ]}
            />

            <SelectSetting
              label="Difficulty Level"
              description="How challenging should the questions be"
              value={settings.difficultyLevel}
              onChange={(value) => handleChange("difficultyLevel", value)}
              options={[
                {
                  value: "mixed",
                  label: "Mixed",
                  description: "Variety of difficulties",
                },
                {
                  value: "easy",
                  label: "Easy",
                  description: "Basic recall and definitions",
                },
                {
                  value: "medium",
                  label: "Medium",
                  description: "Understanding and relationships",
                },
                {
                  value: "hard",
                  label: "Hard",
                  description: "Analysis and application",
                },
              ]}
            />

            <SelectSetting
              label="Question Style"
              description="How questions and hints are phrased"
              value={settings.questionStyle || "conceptual"}
              onChange={(value) => handleChange("questionStyle", value)}
              options={[
                {
                  value: "conceptual",
                  label: "Conceptual",
                  description:
                    'Test understanding of concepts (e.g., "What is the purpose of X?")',
                },
                {
                  value: "text-based",
                  label: "Text-based",
                  description:
                    'Test recall of text content (e.g., "What does the text say about X?")',
                },
              ]}
            />

            <SelectSetting
              label="Quiz Language"
              description="Language for generated questions and answers"
              value={settings.quizLanguage || "english"}
              onChange={(value) => handleChange("quizLanguage", value)}
              options={[
                {
                  value: "english",
                  label: "English",
                  description: "Generate quizzes in English",
                },
                {
                  value: "polish",
                  label: "Polski",
                  description: "Generate quizzes in Polish",
                },
                {
                  value: "spanish",
                  label: "Español",
                  description: "Generate quizzes in Spanish",
                },
                {
                  value: "german",
                  label: "Deutsch",
                  description: "Generate quizzes in German",
                },
              ]}
            />

            <TextareaSetting
              label="Custom Instructions"
              description="Add specific instructions for question generation"
              value={settings.customInstructions}
              onChange={(value) => handleChange("customInstructions", value)}
              placeholder="Example: Focus on Chapter 3, avoid technical jargon, emphasize practical applications, skip historical dates..."
            />
          </div>

          {/* Example Preview */}
          <ExamplePreview
            contentFocus={settings.contentFocus}
            difficultyLevel={settings.difficultyLevel}
            questionStyle={settings.questionStyle}
            allowMultipleCorrectAnswers={settings.allowMultipleCorrectAnswers}
            quizLanguage={settings.quizLanguage}
          />
        </div>

        {/* Pool Settings Section */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2
                  id="learning-pool-heading"
                  className="text-lg font-semibold text-slate-100"
                >
                  Learning Pool
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
                  Advanced
                </span>
                <HelpIcon tooltip="Advanced settings for spaced repetition. Questions you get wrong are added back to the pool for more practice." />
              </div>
              <p className="text-sm text-slate-400">Configure spaced repetition behavior</p>
            </div>
            <button
              onClick={resetLearningPool}
              title="Reset Learning Pool to defaults"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <NumberSetting
              label="Starting Pool Size"
              description="How many times each question appears in your practice pool initially"
              value={settings.defaultPoolSize}
              onChange={(value) => handleChange("defaultPoolSize", value)}
              min={1}
              max={5}
            />

            <NumberSetting
              label="Incorrect on First Try"
              description="Extra copies added when you get a question wrong the first time"
              value={settings.failedOriginalCopies}
              onChange={(value) => handleChange("failedOriginalCopies", value)}
              min={1}
              max={5}
            />

            <NumberSetting
              label="Incorrect on Retry"
              description="Extra copies added when you get a repeated question wrong again"
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
          <span className="text-slate-300 font-medium">Preview:</span> Your quiz
          will have{" "}
          <span className="text-indigo-400 font-medium">
            {settings.amountOfClosedQuestions}
          </span>{" "}
          closed and{" "}
          <span className="text-indigo-400 font-medium">
            {settings.amountOfOpenQuestions}
          </span>{" "}
          open questions.
          {settings.forceMultipleCorrectAnswers
            ? " All closed questions will have multiple correct answers."
            : settings.allowMultipleCorrectAnswers
              ? " Some questions may have multiple correct answers."
              : ""}
        </p>
      </div>
    </div>

    {/* Success Toast */}
    {successMessage && (
      <SuccessToast
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />
    )}

    {/* Reset Confirmation Modal */}
    {showResetModal && (
      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmReset}
        resetType={resetType}
        currentSettings={settings}
      />
    )}
  </>
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

function NumberSetting({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
}: NumberSettingProps) {
  const [inputValue, setInputValue] = React.useState(value.toString());
  const labelId = `${label.toLowerCase().replace(/\s+/g, '-')}-label`;
  const descId = `${label.toLowerCase().replace(/\s+/g, '-')}-description`;

  // Sync input value when external value changes (e.g., from +/- buttons or reset)
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow empty input while typing
    if (rawValue === "") {
      setInputValue("");
      return;
    }

    // Remove leading zeros (except for standalone "0")
    const cleanedValue = rawValue.replace(/^0+/, "") || "0";
    setInputValue(cleanedValue);

    const newValue = parseInt(cleanedValue, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid value
    if (inputValue === "" || isNaN(parseInt(inputValue, 10))) {
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
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200" role="group" aria-labelledby={labelId}>
      <div>
        <p id={labelId} className="text-slate-100 font-medium">{label}</p>
        <p id={descId} className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
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
          aria-label={label}
          aria-describedby={descId}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
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

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleSettingProps) {
  const labelId = `${label.toLowerCase().replace(/\s+/g, '-')}-toggle-label`;
  const descId = `${label.toLowerCase().replace(/\s+/g, '-')}-toggle-description`;

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-200 ${
        disabled ? "opacity-50" : "hover:bg-slate-700/30"
      }`}>
      <div>
        <p
          id={labelId}
          className={`font-medium ${disabled ? "text-slate-400" : "text-slate-100"}`}>
          {label}
        </p>
        <p id={descId} className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${checked ? "bg-indigo-500" : "bg-slate-600"}`}>
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
  helpTooltip?: string;
}

function SectionHeader({ title, description, onReset, helpTooltip }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h2
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
            className="text-lg font-semibold text-slate-100"
          >
            {title}
          </h2>
          {helpTooltip && <HelpIcon tooltip={helpTooltip} />}
        </div>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors duration-200"
        title={`Reset ${title} to defaults`}>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
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

function SelectSetting({
  label,
  description,
  value,
  onChange,
  options,
}: SelectSettingProps) {
  const selectedOption = options.find((o) => o.value === value);

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
          className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer">
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {selectedOption && (
        <p className="text-xs text-slate-500 mt-1">
          {selectedOption.description}
        </p>
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

function TextareaSetting({
  label,
  description,
  value,
  onChange,
  placeholder,
}: TextareaSettingProps) {
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

interface RangeSettingProps {
  label: string;
  description: string;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  absoluteMin: number;
  absoluteMax: number;
}

function RangeSetting({
  label,
  description,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  absoluteMin,
  absoluteMax,
}: RangeSettingProps) {
  const isVariable = minValue !== maxValue;

  return (
    <div className="py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-slate-100 font-medium">{label}</p>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        {isVariable && (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
            Variable
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 w-8">Min</span>
          <button
            onClick={() => onMinChange(Math.max(absoluteMin, minValue - 1))}
            className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={minValue <= absoluteMin}
            aria-label={`Decrease minimum ${label.toLowerCase()}`}>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <span className="w-10 h-8 sm:w-8 sm:h-7 flex items-center justify-center bg-slate-700 border border-slate-600 rounded-md text-slate-100 font-medium text-sm">
            {minValue}
          </span>
          <button
            onClick={() => onMinChange(Math.min(absoluteMax, minValue + 1))}
            className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={minValue >= absoluteMax}
            aria-label={`Increase minimum ${label.toLowerCase()}`}>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <span className="hidden sm:inline text-slate-500">—</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 w-8">Max</span>
          <button
            onClick={() => onMaxChange(Math.max(absoluteMin, maxValue - 1))}
            className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={maxValue <= absoluteMin}
            aria-label={`Decrease maximum ${label.toLowerCase()}`}>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <span className="w-10 h-8 sm:w-8 sm:h-7 flex items-center justify-center bg-slate-700 border border-slate-600 rounded-md text-slate-100 font-medium text-sm">
            {maxValue}
          </span>
          <button
            onClick={() => onMaxChange(Math.min(absoluteMax, maxValue + 1))}
            className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={maxValue >= absoluteMax}
            aria-label={`Increase maximum ${label.toLowerCase()}`}>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {isVariable
          ? `Each question will have ${minValue}-${maxValue} answer options`
          : `All questions will have exactly ${minValue} answer options`}
      </p>
    </div>
  );
}

interface ExamplePreviewProps {
  contentFocus: ContentFocus;
  difficultyLevel: DifficultyLevel;
  questionStyle: QuestionStyle;
  allowMultipleCorrectAnswers: boolean;
  quizLanguage: QuizLanguage;
}

const LANGUAGE_LABELS: Record<QuizLanguage, string> = {
  english: 'English',
  polish: 'Polski',
  spanish: 'Español',
  german: 'Deutsch',
};

function ExamplePreview({
  contentFocus,
  difficultyLevel,
  questionStyle,
  allowMultipleCorrectAnswers,
  quizLanguage,
}: ExamplePreviewProps) {
  // Default to 'important' and 'mixed' if settings are not yet initialized
  const focus = contentFocus || "important";
  const difficulty = difficultyLevel || "mixed";
  const example = EXAMPLE_QUESTIONS[focus][difficulty];

  return (
    <div role="region" aria-label="Example question preview" className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-400">Example Preview</p>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
            {questionStyle === 'conceptual' ? 'Conceptual' : 'Text-based'}
          </span>
          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
            {LANGUAGE_LABELS[quizLanguage]}
          </span>
        </div>
      </div>

      {/* Sample text */}
      <p className="text-xs text-slate-500 mb-3 italic leading-relaxed">
        "{SAMPLE_TEXT}"
      </p>

      {/* Example question card */}
      <p className="text-xs text-slate-400 mb-2">
        With your settings, questions might look like:
      </p>
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
          {allowMultipleCorrectAnswers && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400">Another correct answer</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0"></span>
            <span className="text-slate-400">{example.answers[1]}</span>
          </div>
        </div>
      </div>

      {/* Hint about current settings */}
      <p className="text-xs text-slate-500 mt-2">
        {focus === "important"
          ? "Focusing on core concepts"
          : "Including all details from text"}
        {" · "}
        {difficulty === "easy"
          ? "Basic recall"
          : difficulty === "medium"
            ? "Understanding-based"
            : difficulty === "hard"
              ? "Analysis-level"
              : "Varied difficulty"}
        {allowMultipleCorrectAnswers && " · Multiple correct answers enabled"}
      </p>
    </div>
  );
}
