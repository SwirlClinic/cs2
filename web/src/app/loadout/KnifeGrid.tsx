"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { SkinItem } from "@/lib/types";

interface KnifeGridProps {
  currentKnife?: string;
  onSelectKnife: (weaponName: string, displayName: string) => void;
}

export default function KnifeGrid({ currentKnife, onSelectKnife }: KnifeGridProps) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((knife) => (
          <SkinCard
            key={knife.weapon_name}
            name={knife.paint_name}
            image={knife.image}
            selected={currentKnife === knife.weapon_name}
            onClick={() => onSelectKnife(knife.weapon_name, knife.paint_name)}
          />
        ))}
      </div>
    </div>
  );
}
