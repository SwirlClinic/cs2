"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import WearSeedControls from "./WearSeedControls";
import type { SkinItem } from "@/lib/types";

interface SkinPickerProps {
  weaponDefindex: number;
  weaponName: string;
  currentPaintId?: number;
  team: number;
  onSave: (data: {
    weapon_defindex: number;
    weapon_paint_id: number;
    weapon_wear: number;
    weapon_seed: number;
  }) => void;
  onClose: () => void;
}

export default function SkinPicker({
  weaponDefindex,
  weaponName,
  currentPaintId,
  team,
  onSave,
  onClose,
}: SkinPickerProps) {
  const [skins, setSkins] = useState<SkinItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPaint, setSelectedPaint] = useState<number | null>(
    currentPaintId ?? null
  );
  const [wear, setWear] = useState(0.0001);
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load skins for this weapon from the category endpoint
    // We fetch the weapon category and filter client-side
    const category = getWeaponCategoryForFetch(weaponDefindex);
    fetch(`/api/items/${category}`)
      .then((r) => r.json())
      .then((data: SkinItem[]) => {
        const filtered = data.filter(
          (s) => s.weapon_defindex === weaponDefindex
        );
        setSkins(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [weaponDefindex]);

  const filtered = useMemo(() => {
    if (!search) return skins;
    const q = search.toLowerCase();
    return skins.filter((s) => s.paint_name.toLowerCase().includes(q));
  }, [skins, search]);

  const selectedSkin = skins.find(
    (s) => Number(s.paint) === selectedPaint
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-bg border-l border-border flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-bright">
            {weaponName} Skins
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
            placeholder={`Search ${weaponName} skins...`}
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
              onClick={() =>
                onSave({
                  weapon_defindex: weaponDefindex,
                  weapon_paint_id: selectedPaint,
                  weapon_wear: wear,
                  weapon_seed: seed,
                })
              }
              className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to map defindex to API category
function getWeaponCategoryForFetch(defindex: number): string {
  const pistols = [1, 2, 3, 4, 30, 32, 36, 61, 63, 64];
  const rifles = [7, 8, 9, 10, 11, 13, 16, 38, 39, 40, 60];
  const smgs = [17, 19, 23, 24, 26, 33, 34];
  const shotguns = [25, 27, 29, 35];
  const machineguns = [14, 28];

  if (pistols.includes(defindex)) return "pistols";
  if (rifles.includes(defindex)) return "rifles";
  if (smgs.includes(defindex)) return "smgs";
  if (shotguns.includes(defindex)) return "shotguns";
  if (machineguns.includes(defindex)) return "machineguns";
  return "knives";
}
