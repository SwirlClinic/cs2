"use client";

import SkinCard from "./SkinCard";

interface Item {
  id: string;
  name: string;
  image: string;
}

interface ItemGridProps {
  items: Item[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

export default function ItemGrid({
  items,
  selectedId,
  onSelect,
  emptyMessage = "No items found",
}: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-dim text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {items.map((item) => (
        <SkinCard
          key={item.id}
          name={item.name}
          image={item.image}
          selected={selectedId === item.id}
          onClick={() => onSelect?.(item.id)}
        />
      ))}
    </div>
  );
}
