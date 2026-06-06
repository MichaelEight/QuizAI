import { DateRangeFilter } from "../../types/usage";

interface DateRangePickerProps {
  selected: DateRangeFilter;
  onChange: (range: DateRangeFilter) => void;
}

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  [DateRangeFilter.LAST_7_DAYS]: "Last 7 Days",
  [DateRangeFilter.LAST_30_DAYS]: "Last 30 Days",
  [DateRangeFilter.LAST_YEAR]: "Last Year",
  [DateRangeFilter.ALL_TIME]: "All Time",
};

export function DateRangePicker({ selected, onChange }: DateRangePickerProps) {
  const ranges: DateRangeFilter[] = [
    DateRangeFilter.LAST_7_DAYS,
    DateRangeFilter.LAST_30_DAYS,
    DateRangeFilter.LAST_YEAR,
    DateRangeFilter.ALL_TIME,
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">Filter:</span>
      <div className="flex gap-2">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selected === range
                ? "bg-indigo-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {DATE_RANGE_LABELS[range]}
          </button>
        ))}
      </div>
    </div>
  );
}
