import { useState, useRef, useEffect } from "react";
import { UsageLog } from "../../types/usage";
import { exportLogsToCSV, exportLogsToJSON } from "../../services/usageAnalytics";

interface ExportButtonProps {
  logs: UsageLog[];
}

export function ExportButton({ logs }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = (format: "csv" | "json") => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `usage-logs-${timestamp}.${format}`;

    let content: string;
    let mimeType: string;

    if (format === "csv") {
      content = exportLogsToCSV(logs);
      mimeType = "text/csv";
    } else {
      content = exportLogsToJSON(logs);
      mimeType = "application/json";
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={logs.length === 0}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
          <div className="py-1">
            <button
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
