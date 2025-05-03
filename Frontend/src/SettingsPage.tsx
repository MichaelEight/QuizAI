import { Settings, SettingsTypes } from "./SettingsType";
import "./Settings.css";

export default function SettingsPage({settings, setSettings}){
    const handleChange = (key: keyof Settings, value: SettingsTypes) => {
        setSettings((prevSettings: Settings) => ({
            ...prevSettings,
            [key]: value,
        }))
    }

    // Assign values to each input

    return(
        <>
            <p>Settings Page</p>
            <div className="input-container">
                <p>Closed questions</p>
                <input type="number" value={settings.amountOfClosedQuestions} min={0} max={10} step={1} onChange={(e) => handleChange("amountOfClosedQuestions", Number(e.target.value))}/>
            </div>
        </>
    )
}