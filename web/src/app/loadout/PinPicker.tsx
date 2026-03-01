"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { CollectibleItem } from "@/lib/types";

interface PinPickerProps {
  team: number;
  currentPinId?: number;
  onSave: (pinId: number) => void;
}

export default function PinPicker({
  team,
  currentPinId,
  onSave,
}: PinPickerProps) {
  const [items, setItems] = useState<CollectibleItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(currentPinId || 0);

  useEffect(() => {
    fetch("/api/items/pins")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search pins..."
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
