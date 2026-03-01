"use client";

import Image from "next/image";

interface SkinCardProps {
  name: string;
  image: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function SkinCard({
  name,
  image,
  selected,
  onClick,
}: SkinCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative bg-surface border rounded-lg p-2 transition-all hover:bg-surface-hover hover:border-accent/50 cursor-pointer ${
        selected ? "border-accent ring-1 ring-accent/30" : "border-border"
      }`}
    >
      <div className="aspect-[4/3] relative mb-2 flex items-center justify-center">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-1"
            sizes="(max-width: 768px) 50vw, 200px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-border/20 rounded flex items-center justify-center text-text-dim text-xs">
            No image
          </div>
        )}
      </div>
      <p className="text-xs text-text truncate text-center">{name}</p>
    </button>
  );
}
