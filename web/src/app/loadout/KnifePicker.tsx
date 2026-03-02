"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import WearSeedControls from "./WearSeedControls";
import type { SkinItem } from "@/lib/types";

interface KnifePickerProps {
  knifeWeaponName: string;
  displayName: string;
  team: number;
  currentPaintId?: number;
  onSave: (knife: string, defindex: number, paintId: number, wear: number, seed: number) => void;
  onClose: () => void;
}

export default function KnifePicker({
  knifeWeaponName,
  displayName,
  team,
  currentPaintId,
  onSave,
  onClose,
}: KnifePickerProps) {
  const [skins, setSkins] = useState<SkinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPaint, setSelectedPaint] = useState<number | null>(
    currentPaintId ?? null
  );
  const [wear, setWear] = useState(0.0001);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/items/knives")
      .then((r) => r.json())
      .then((data: SkinItem[]) => {
        setSkins(data.filter((s) => s.weapon_name === knifeWeaponName));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [knifeWeaponName]);

  const filtered = useMemo(() => {
    if (!search) return skins;
    const q = search.toLowerCase();
    return skins.filter((s) => s.paint_name.toLowerCase().includes(q));
  }, [skins, search]);

  const selectedSkin = skins.find((s) => Number(s.paint) === selectedPaint);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-bg border-l border-border flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-bright">
            {displayName} Skins
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text text-xl"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={`Search ${displayName} skins...`}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-text-dim">
              Loading skins...
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((skin) => (
                <SkinCard
                  key={`${skin.weapon_defindex}-${skin.paint}`}
                  name={skin.paint_name}
                  image={skin.image}
                  selected={Number(skin.paint) === selectedPaint}
                  onClick={() => setSelectedPaint(Number(skin.paint))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        {selectedPaint !== null && (
          <div className="border-t border-border p-4 space-y-4">
            {selectedSkin && (
              <p className="text-sm text-text-bright">
                {selectedSkin.paint_name}
              </p>
            )}
            <WearSeedControls
              wear={wear}
              seed={seed}
              onWearChange={setWear}
              onSeedChange={setSeed}
            />
            <button
              onClick={() => {
                const skin = skins.find(
                  (s) => Number(s.paint) === selectedPaint
                );
                if (skin) {
                  onSave(
                    knifeWeaponName,
                    skin.weapon_defindex,
                    selectedPaint,
                    wear,
                    seed
                  );
                }
              }}
              className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save Knife + Skin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
