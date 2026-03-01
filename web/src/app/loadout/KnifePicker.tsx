"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import WearSeedControls from "./WearSeedControls";
import type { SkinItem } from "@/lib/types";

interface KnifePickerProps {
  team: number;
  currentKnife?: string;
  currentDefindex?: number;
  currentPaintId?: number;
  onSave: (knife: string, defindex: number, paintId: number, wear: number, seed: number) => void;
}

export default function KnifePicker({
  team,
  currentKnife,
  currentDefindex,
  currentPaintId,
  onSave,
}: KnifePickerProps) {
  const [items, setItems] = useState<SkinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Always start at step 1 (knife type selection) — don't auto-skip
  const [selectedKnife, setSelectedKnife] = useState("");
  const [selectedPaint, setSelectedPaint] = useState<number | null>(null);
  const [wear, setWear] = useState(0.0001);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/items/knives")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by weapon_name to show knife types
  const knifeTypes = useMemo(() => {
    const map = new Map<string, SkinItem>();
    for (const item of items) {
      if (Number(item.paint) === 0 || !map.has(item.weapon_name)) {
        map.set(item.weapon_name, item);
      }
    }
    return Array.from(map.values());
  }, [items]);

  // Get skins for the selected knife type
  const knifeSkins = useMemo(() => {
    if (!selectedKnife) return [];
    return items.filter((i) => i.weapon_name === selectedKnife);
  }, [items, selectedKnife]);

  const filteredTypes = useMemo(() => {
    if (!search) return knifeTypes;
    const q = search.toLowerCase();
    return knifeTypes.filter((k) => k.paint_name.toLowerCase().includes(q));
  }, [knifeTypes, search]);

  const filteredSkins = useMemo(() => {
    if (!search) return knifeSkins;
    const q = search.toLowerCase();
    return knifeSkins.filter((s) => s.paint_name.toLowerCase().includes(q));
  }, [knifeSkins, search]);

  const selectedSkin = knifeSkins.find((s) => Number(s.paint) === selectedPaint);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-text-dim text-sm">
        Loading knives...
      </div>
    );
  }

  // Step 1: Show knife type picker
  if (!selectedKnife) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-dim">
          Step 1: Choose a knife type
          {currentKnife && (
            <span className="ml-2 text-accent">
              (current: {knifeTypes.find((k) => k.weapon_name === currentKnife)?.paint_name || currentKnife})
            </span>
          )}
        </p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search knives..." />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredTypes.map((knife) => (
            <SkinCard
              key={knife.weapon_name}
              name={knife.paint_name}
              image={knife.image}
              selected={currentKnife === knife.weapon_name}
              onClick={() => {
                setSelectedKnife(knife.weapon_name);
                setSelectedPaint(null);
                setSearch("");
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Show skins for selected knife type
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setSelectedKnife("");
            setSelectedPaint(null);
            setSearch("");
          }}
          className="text-text-dim hover:text-text text-sm flex items-center gap-1"
        >
          &larr; Back to knives
        </button>
        <span className="text-sm text-text-bright font-medium">
          Step 2: Choose a skin for {knifeTypes.find((k) => k.weapon_name === selectedKnife)?.paint_name || selectedKnife}
        </span>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search skins..." />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filteredSkins.map((skin) => (
          <SkinCard
            key={`${skin.weapon_defindex}-${skin.paint}`}
            name={skin.paint_name}
            image={skin.image}
            selected={Number(skin.paint) === selectedPaint}
            onClick={() => setSelectedPaint(Number(skin.paint))}
          />
        ))}
      </div>

      {selectedPaint !== null && (
        <div className="border-t border-border pt-4 space-y-4">
          {selectedSkin && (
            <p className="text-sm text-text-bright">{selectedSkin.paint_name}</p>
          )}
          <WearSeedControls wear={wear} seed={seed} onWearChange={setWear} onSeedChange={setSeed} />
          <button
            onClick={() => {
              const defindex = knifeSkins.find((s) => Number(s.paint) === selectedPaint)?.weapon_defindex;
              if (defindex !== undefined) {
                onSave(selectedKnife, defindex, selectedPaint, wear, seed);
              }
            }}
            className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save Knife + Skin
          </button>
        </div>
      )}
    </div>
  );
}
