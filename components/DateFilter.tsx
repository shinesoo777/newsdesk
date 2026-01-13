"use client";

interface DateFilterProps {
  days: number;
  onDaysChange: (days: number) => void;
}

export default function DateFilter({ days, onDaysChange }: DateFilterProps) {
  const options = [
    { label: "7일", value: 7 },
    { label: "14일", value: 14 },
    { label: "30일", value: 30 },
    { label: "60일", value: 60 },
  ];

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">기간:</label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onDaysChange(option.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              days === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
