import { Settings, SettingsTypes } from "./SettingsType";
import "./Settings.css";

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
    <div className="settings-page-container">
      <h2 className="text-2xl font-bold">Settings Page</h2>
      <div className="inputs-container">
        <div className="input-container">
          <p>Closed questions</p>
          <input
            className="border border-solid border-black"
            type="number"
            min={0}
            max={10}
            step={1}
            value={settings.amountOfClosedQuestions}
            onChange={(e) =>
              handleChange("amountOfClosedQuestions", Number(e.target.value))
            }
          />
        </div>

        <div className="input-container">
          <p>Open questions</p>
          <input
            className="border border-solid border-black"
            type="number"
            min={0}
            max={10}
            step={1}
            value={settings.amountOfOpenQuestions}
            onChange={(e) =>
              handleChange("amountOfOpenQuestions", Number(e.target.value))
            }
          />
        </div>

        <div className="input-container">
          <p>Allow multiple correct answers</p>
          <input
            type="checkbox"
            checked={settings.allowMultipleCorrectAnswers}
            onChange={(e) =>
              handleChange("allowMultipleCorrectAnswers", e.target.checked)
            }
          />
        </div>

        <div className="input-container">
          <p>Force multiple correct answers</p>
          <input
            type="checkbox"
            checked={settings.forceMultipleCorrectAnswers}
            onChange={(e) =>
              handleChange("forceMultipleCorrectAnswers", e.target.checked)
            }
          />
        </div>
      </div>
    </div>
  );
}
