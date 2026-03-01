"use client";

import { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import SkinCard from "@/components/SkinCard";
import type { KeychainItem } from "@/lib/types";

interface KeychainPickerProps {
  onSelect: (keychainId: string) => void;
  onClose: () => void;
}

export default function KeychainPicker({ onSelect, onClose }: KeychainPickerProps) {
  const [items, setItems] = useState<KeychainItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/items/keychains")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((k) => k.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-bg border-l border-border flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-bright">
            Select Keychain
          </h2>
          <button onClick={onClose} className="text-text-dim hover:text-text text-xl">
            &times;
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <SearchBar value={search} onChange={setSearch} placeholder="Search keychains..." />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filtered.map((keychain) => (
              <SkinCard
                key={keychain.id}
                name={keychain.name}
                image={keychain.image}
                onClick={() => {
                  onSelect(keychain.id);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
