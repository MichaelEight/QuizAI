import { Settings, SettingsTypes } from "./SettingsType";

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

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">Configure your quiz generation preferences</p>
      </div>

      {/* Settings Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
        {/* Question Amounts Section */}
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Question Amounts</h2>
          <p className="text-sm text-slate-400 mb-6">Set how many questions to generate</p>

          <div className="space-y-4">
            <NumberSetting
              label="Closed Questions"
              description="Multiple choice questions with 4 options"
              value={settings.amountOfClosedQuestions}
              onChange={(value) => handleChange("amountOfClosedQuestions", value)}
              min={0}
              max={10}
            />

            <NumberSetting
              label="Open Questions"
              description="Free-form text answer questions"
              value={settings.amountOfOpenQuestions}
              onChange={(value) => handleChange("amountOfOpenQuestions", value)}
              min={0}
              max={10}
            />
          </div>
        </div>

        {/* Question Options Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Question Options</h2>
          <p className="text-sm text-slate-400 mb-6">Configure closed question behavior</p>

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

function NumberSetting({ label, description, value, onChange, min = 0, max = 10 }: NumberSettingProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
      <div>
        <p className="text-slate-100 font-medium">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value <= min}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-8 text-center text-slate-100 font-medium text-lg">{value}</span>
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
