"use client";

import * as Slider from "@radix-ui/react-slider";

const WEAR_PRESETS = [
  { label: "FN", value: 0.0001, name: "Factory New" },
  { label: "MW", value: 0.1, name: "Minimal Wear" },
  { label: "FT", value: 0.2, name: "Field-Tested" },
  { label: "WW", value: 0.38, name: "Well-Worn" },
  { label: "BS", value: 0.45, name: "Battle-Scarred" },
];

interface WearSeedControlsProps {
  wear: number;
  seed: number;
  onWearChange: (wear: number) => void;
  onSeedChange: (seed: number) => void;
}

export default function WearSeedControls({
  wear,
  seed,
  onWearChange,
  onSeedChange,
}: WearSeedControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-text-dim mb-2">
          Wear: {wear.toFixed(4)}
        </label>
        <div className="flex gap-1 mb-2">
          {WEAR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onWearChange(preset.value)}
              title={preset.name}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                Math.abs(wear - preset.value) < 0.01
                  ? "bg-accent text-white"
                  : "bg-surface-hover text-text-dim hover:text-text"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[wear]}
          onValueChange={([v]) => onWearChange(v)}
          max={1}
          min={0}
          step={0.0001}
        >
          <Slider.Track className="bg-border relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-accent rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-accent" />
        </Slider.Root>
      </div>

      <div>
        <label className="block text-xs text-text-dim mb-1">Seed</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => onSeedChange(Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)))}
          min={0}
          max={1000}
          className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
