"use client";

interface TeamToggleProps {
  team: number;
  onChange: (team: number) => void;
}

export default function TeamToggle({ team, onChange }: TeamToggleProps) {
  return (
    <div className="inline-flex bg-surface border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => onChange(2)}
        className={`px-4 py-1.5 text-sm font-medium transition-colors ${
          team === 2
            ? "bg-orange-600 text-white"
            : "text-text-dim hover:text-text"
        }`}
      >
        T
      </button>
      <button
        onClick={() => onChange(3)}
        className={`px-4 py-1.5 text-sm font-medium transition-colors ${
          team === 3
            ? "bg-blue-600 text-white"
            : "text-text-dim hover:text-text"
        }`}
      >
        CT
      </button>
    </div>
  );
}
