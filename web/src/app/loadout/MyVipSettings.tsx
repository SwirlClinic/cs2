"use client";

import { useState, useEffect } from "react";

const TOGGLEABLE_PERKS: { key: string; label: string; description: string }[] = [
  { key: "bhop", label: "Bunny Hop", description: "Auto bunny hop when holding jump" },
  { key: "unlimited_ammo", label: "Unlimited Grenades", description: "Grenades are replenished after throwing" },
];

interface VipMeData {
  group_name: string;
  expire_date: string;
  perks: Record<string, number | boolean>;
  preferences: Record<string, boolean> | null;
}

export default function MyVipSettings() {
  const [data, setData] = useState<VipMeData | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vip/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not VIP");
        return r.json();
      })
      .then((d: VipMeData) => {
        setData(d);
        setPreferences(d.preferences ?? {});
      })
      .catch(() => setError("Could not load VIP data"));
  }, []);

  const handleToggle = async (key: string, enabled: boolean) => {
    const newPrefs = { ...preferences, [key]: enabled };
    setPreferences(newPrefs);
    setSaving(key);

    try {
      const res = await fetch("/api/vip/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: newPrefs }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setPreferences(preferences);
    }
    setSaving(null);
  };

  if (error) {
    return (
      <div className="text-text-dim text-sm">{error}</div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-text-dim">
        Loading VIP settings...
      </div>
    );
  }

  const expireDate = new Date(data.expire_date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Only show perks that are enabled on the group
  const availablePerks = TOGGLEABLE_PERKS.filter(
    (p) => data.perks[p.key] === true
  );

  return (
    <div className="space-y-6 max-w-lg">
      {/* VIP info */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="text-text-bright font-semibold text-lg">{data.group_name}</h3>
            <p className="text-text-dim text-sm">Expires {expireDate}</p>
          </div>
        </div>
      </div>

      {/* Perk toggles */}
      {availablePerks.length > 0 ? (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <h4 className="text-text-bright font-medium text-sm uppercase tracking-wider">
            Perk Preferences
          </h4>
          {availablePerks.map((perk) => {
            const isEnabled = preferences[perk.key] !== false;
            return (
              <div
                key={perk.key}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-text text-sm font-medium">{perk.label}</p>
                  <p className="text-text-dim text-xs">{perk.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(perk.key, !isEnabled)}
                  disabled={saving === perk.key}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isEnabled ? "bg-accent" : "bg-border"
                  } ${saving === perk.key ? "opacity-50" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-dim text-sm">
            No toggleable perks available for your VIP group.
          </p>
        </div>
      )}
    </div>
  );
}
