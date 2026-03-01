"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { GloveItem } from "@/lib/types";

interface GlovePickerProps {
  team: number;
  currentDefindex?: number;
  currentPaint?: number;
  onSave: (defindex: number, paint: number) => void;
}

export default function GlovePicker({
  team,
  currentDefindex,
  currentPaint,
  onSave,
}: GlovePickerProps) {
  const [items, setItems] = useState<GloveItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(
    currentDefindex && currentPaint
      ? `${currentDefindex}-${currentPaint}`
      : ""
  );

  useEffect(() => {
    fetch("/api/items/gloves")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((g) => g.paint_name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search gloves..."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((glove) => {
          const id = `${glove.weapon_defindex}-${glove.paint}`;
          return (
            <SkinCard
              key={id}
              name={glove.paint_name}
              image={glove.image}
              selected={selectedId === id}
              onClick={() => {
                setSelectedId(id);
                onSave(glove.weapon_defindex, Number(glove.paint));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
