"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { StickerItem } from "@/lib/types";

interface StickerPickerProps {
  onSelect: (stickerId: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [items, setItems] = useState<StickerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items/stickers")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items.slice(0, 100); // Limit initial display
    const q = search.toLowerCase();
    return items.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 100);
  }, [items, search]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-bg border-l border-border flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-bright">
            Select Sticker
          </h2>
          <button onClick={onClose} className="text-text-dim hover:text-text text-xl">
            &times;
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <SearchBar value={search} onChange={setSearch} placeholder="Search stickers..." />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-text-dim">
              Loading stickers...
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((sticker) => (
                <SkinCard
                  key={sticker.id}
                  name={sticker.name}
                  image={sticker.image}
                  onClick={() => {
                    onSelect(sticker.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
