import { MODEL_LIST, DEFAULT_MODEL, ModelId } from "../services/constants";

interface ModelPickerProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
  /** Show the "AI Model" heading + helper line above the list. */
  showHeader?: boolean;
}

// Reusable radio-list model picker. Used for the global AI model (settings)
// and can be embedded anywhere a full, informed model choice is wanted.
export function ModelPicker({ value, onChange, showHeader = true }: ModelPickerProps) {
  return (
    <div>
      {showHeader && (
        <>
          <p className="text-slate-100 font-medium mb-1">AI Model</p>
          <p className="text-sm text-slate-400 mb-3">
            Pricier models give better quality. Cost shown per 1M tokens (in / out).
          </p>
        </>
      )}

      <div role="radiogroup" aria-label="AI Model" className="grid gap-2">
        {MODEL_LIST.map((m) => {
          const isSelected = value === m.id;
          const isDefault = m.id === DEFAULT_MODEL;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(m.id)}
              className={`flex items-center gap-3 w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500"
                  : "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700/30"
              }`}
            >
              {/* Radio indicator */}
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-indigo-500" : "border-slate-600"
                }`}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
              </span>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-medium">{m.label}</span>
                  {isDefault && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-600/60 text-slate-300 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">{m.description}</p>
              </div>

              {/* Pricing */}
              <div className="text-right shrink-0">
                <p className="text-sm text-emerald-400 font-medium tabular-nums">
                  ${m.inputCostPer1M.toFixed(2)}
                  <span className="text-slate-500"> / </span>
                  ${m.outputCostPer1M.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-500">per 1M in / out</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
