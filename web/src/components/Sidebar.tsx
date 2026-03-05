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

const ADMIN_CATEGORIES = [
  { id: "vip", label: "VIP", icon: "⭐" },
  { id: "server", label: "Server", icon: "🖥️" },
] as const;

const VIP_CATEGORIES = [
  { id: "myvip", label: "My VIP", icon: "⭐" },
] as const;

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  showVip?: boolean;
  showMyVip?: boolean;
}

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  showVip,
  showMyVip,
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

        {showMyVip && (
          <>
            <div className="border-t border-border my-3" />
            <p className="text-xs uppercase tracking-wider text-text-dim mb-2 px-2">
              VIP
            </p>
            <ul className="space-y-0.5">
              {VIP_CATEGORIES.map((cat) => (
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
          </>
        )}

        {showVip && (
          <>
            <div className="border-t border-border my-3" />
            <p className="text-xs uppercase tracking-wider text-text-dim mb-2 px-2">
              Admin
            </p>
            <ul className="space-y-0.5">
              {ADMIN_CATEGORIES.map((cat) => (
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
          </>
        )}
      </div>
    </nav>
  );
}
