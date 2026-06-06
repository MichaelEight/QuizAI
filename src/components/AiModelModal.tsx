import { BaseModal } from "./BaseModal";
import { ModelPicker } from "./ModelPicker";
import { ModelId } from "../services/constants";

interface AiModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: ModelId;
  onChange: (id: ModelId) => void;
}

// Global AI model chooser — the model used for every AI operation in the app.
export function AiModelModal({ isOpen, onClose, value, onChange }: AiModelModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">AI Model</h2>
          <p className="mt-1 text-sm text-slate-400">
            Used for everything — generating quizzes, grading answers, hints and
            explanations. You can still pick a different model for a single quiz
            on the Create page.
          </p>
        </div>

        <ModelPicker value={value} onChange={onChange} showHeader={false} />

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-400 active:bg-indigo-600"
          >
            Done
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
