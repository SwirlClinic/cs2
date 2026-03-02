"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import type { SkinItem, PlayerSkin } from "@/lib/types";

interface KnifeGridProps {
  currentKnife?: string;
  skins: PlayerSkin[];
  team: number;
  onSelectKnife: (weaponName: string, displayName: string, defindex: number) => void;
}

export default function KnifeGrid({
  currentKnife,
  skins,
  team,
  onSelectKnife,
}: KnifeGridProps) {
  const [items, setItems] = useState<SkinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const knifeTypes = useMemo(() => {
    const map = new Map<string, SkinItem>();
    for (const item of items) {
      if (Number(item.paint) === 0 || !map.has(item.weapon_name)) {
        map.set(item.weapon_name, item);
      }
    }
    return Array.from(map.values());
  }, [items]);

  const filtered = useMemo(() => {
    if (!search) return knifeTypes;
    const q = search.toLowerCase();
    return knifeTypes.filter((k) => k.paint_name.toLowerCase().includes(q));
  }, [knifeTypes, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-text-dim text-sm">
        Loading knives...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search knives..." />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((knife) => {
          const isEquipped = currentKnife === knife.weapon_name;

          // Find equipped skin image and name for THIS knife type's defindex
          let image = knife.image;
          let skinName = "Default";
          if (isEquipped) {
            const knifeSkin = skins.find(
              (s) => s.weapon_defindex === knife.weapon_defindex && s.weapon_team === team
            );
            if (knifeSkin) {
              const equippedEntry = items.find(
                (s) =>
                  s.weapon_defindex === knife.weapon_defindex &&
                  Number(s.paint) === knifeSkin.weapon_paint_id
              );
              if (equippedEntry) {
                image = equippedEntry.image;
                skinName = equippedEntry.paint_name;
              }
            }
          }

          return (
            <button
              key={knife.weapon_name}
              onClick={() => onSelectKnife(knife.weapon_name, knife.paint_name, knife.weapon_defindex)}
              className={`bg-surface border rounded-lg p-3 hover:bg-surface-hover hover:border-accent/50 transition-all cursor-pointer group ${
                isEquipped ? "border-accent ring-1 ring-accent/30" : "border-border"
              }`}
            >
              <div className="aspect-[4/3] relative mb-2 flex items-center justify-center">
                {image ? (
                  <Image
                    src={image}
                    alt={knife.paint_name}
                    fill
                    className="object-contain p-1"
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div className="text-text-dim text-2xl">?</div>
                )}
              </div>
              <p className="text-xs text-text-bright font-medium truncate">
                {knife.paint_name}
              </p>
              {isEquipped && (
                <p className="text-xs text-text-dim truncate">{skinName}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
