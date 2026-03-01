"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { MusicItem } from "@/lib/types";

interface MusicPickerProps {
  team: number;
  currentMusicId?: number;
  onSave: (musicId: number) => void;
}

export default function MusicPicker({
  team,
  currentMusicId,
  onSave,
}: MusicPickerProps) {
  const [items, setItems] = useState<MusicItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(currentMusicId || 0);

  useEffect(() => {
    fetch("/api/items/music")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((m) => m.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search music kits..."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((item) => (
          <SkinCard
            key={item.id}
            name={item.name}
            image={item.image}
            selected={selected === Number(item.id)}
            onClick={() => {
              setSelected(Number(item.id));
              onSave(Number(item.id));
            }}
          />
        ))}
      </div>
    </div>
  );
}
