import { useState, useEffect } from "react";
import { ScoreBreakdownTemplate } from "../QuestionsTypes";

interface OptionsSelectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelect: (index: number) => void;
  readonly options: (string | ScoreBreakdownTemplate)[];
  readonly title: string;
  readonly fieldType: "expectedAnswer" | "explanation" | "scoreTemplate";
}

export function OptionsSelectionModal({
  isOpen,
  onClose,
  onSelect,
  options,
  title,
  fieldType,
}: Readonly<OptionsSelectionModalProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "1" && options.length >= 1) {
        setSelectedIndex(0);
      } else if (e.key === "2" && options.length >= 2) {
        setSelectedIndex(1);
      } else if (e.key === "3" && options.length >= 3) {
        setSelectedIndex(2);
      } else if (e.key === "Enter" && selectedIndex !== null) {
        handleApply();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, options.length]);

  const handleApply = () => {
    if (selectedIndex !== null) {
      onSelect(selectedIndex);
    }
  };

  const formatOption = (option: string | ScoreBreakdownTemplate): string => {
    if (fieldType === "scoreTemplate") {
      const template = option as ScoreBreakdownTemplate;
      return template
        .map((item, idx) => `${idx + 1}. ${item.description} (${item.points} pts)`)
        .join("\n");
    }
    return option as string;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {options.map((option, index) => {
            const formattedOption = formatOption(option);
            const isSelected = selectedIndex === index;

            return (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`cursor-pointer rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-slate-100 hover:border-slate-400"
                }`}>
                <div className="p-4 flex items-start gap-3">
                  {/* Radio button */}
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600"
                          : "border-slate-400"
                      }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-600 mb-1">
                      Option {index + 1}
                      <span className="ml-2 text-xs text-slate-400">
                        (Press {index + 1})
                      </span>
                    </div>
                    <div className="text-sm text-slate-900 whitespace-pre-wrap break-words">
                      {formattedOption}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={selectedIndex === null}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
