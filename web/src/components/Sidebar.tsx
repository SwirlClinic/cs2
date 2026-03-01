"use client";

const CATEGORIES = [
  { id: "pistols", label: "Pistols", icon: "🔫" },
  { id: "rifles", label: "Rifles", icon: "🎯" },
  { id: "smgs", label: "SMGs", icon: "💨" },
  { id: "shotguns", label: "Shotguns", icon: "💥" },
  { id: "machineguns", label: "Machine Guns", icon: "⚙️" },
  { id: "knives", label: "Knives", icon: "🔪" },
  { id: "gloves", label: "Gloves", icon: "🧤" },
  { id: "agents", label: "Agents", icon: "🕵️" },
  { id: "music", label: "Music Kits", icon: "🎵" },
  { id: "pins", label: "Pins", icon: "📌" },
] as const;

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function Sidebar({
  activeCategory,
  onCategoryChange,
}: SidebarProps) {
  return (
    <nav className="w-48 bg-surface border-r border-border shrink-0 overflow-y-auto">
      <div className="p-3">
        <p className="text-xs uppercase tracking-wider text-text-dim mb-2 px-2">
          Categories
        </p>
        <ul className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onCategoryChange(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? "bg-accent text-white"
                    : "text-text hover:bg-surface-hover"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
