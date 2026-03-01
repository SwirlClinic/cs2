"use client";

import Image from "next/image";
import { DEFINDEX_TO_WEAPON, WEAPON_NAMES } from "@/lib/weapons";
import type { PlayerSkin, SkinItem } from "@/lib/types";

// Defindexes per category
const CATEGORY_WEAPONS: Record<string, number[]> = {
  pistols: [1, 2, 3, 4, 30, 32, 36, 61, 63, 64],
  rifles: [7, 8, 9, 10, 11, 13, 16, 38, 39, 40, 60],
  smgs: [17, 19, 23, 24, 26, 33, 34],
  shotguns: [25, 27, 29, 35],
  machineguns: [14, 28],
};

interface WeaponGridProps {
  category: string;
  team: number;
  skins: PlayerSkin[];
  skinCatalog: SkinItem[];
  onSelectWeapon: (defindex: number) => void;
}

export default function WeaponGrid({
  category,
  team,
  skins,
  skinCatalog,
  onSelectWeapon,
}: WeaponGridProps) {
  const defindexes = CATEGORY_WEAPONS[category];
  if (!defindexes) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {defindexes.map((defindex) => {
        const weaponName =
          WEAPON_NAMES[DEFINDEX_TO_WEAPON[defindex]] ||
          DEFINDEX_TO_WEAPON[defindex] ||
          `Weapon ${defindex}`;

        // Find current skin for this weapon + team
        const equipped = skins.find(
          (s) =>
            s.weapon_defindex === defindex &&
            s.weapon_team === team
        );

        // Find the catalog entry to get the image
        let image = "";
        let skinName = "Default";
        if (equipped) {
          const catalogEntry = skinCatalog.find(
            (s) =>
              s.weapon_defindex === defindex &&
              Number(s.paint) === equipped.weapon_paint_id
          );
          if (catalogEntry) {
            image = catalogEntry.image;
            skinName = catalogEntry.paint_name;
          }
        } else {
          // Show default weapon image
          const defaultEntry = skinCatalog.find(
            (s) => s.weapon_defindex === defindex && Number(s.paint) === 0
          );
          if (defaultEntry) {
            image = defaultEntry.image;
          }
        }

        return (
          <button
            key={defindex}
            onClick={() => onSelectWeapon(defindex)}
            className="bg-surface border border-border rounded-lg p-3 hover:bg-surface-hover hover:border-accent/50 transition-all cursor-pointer group"
          >
            <div className="aspect-[4/3] relative mb-2 flex items-center justify-center">
              {image ? (
                <Image
                  src={image}
                  alt={weaponName}
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
              {weaponName}
            </p>
            <p className="text-xs text-text-dim truncate">{skinName}</p>
          </button>
        );
      })}
    </div>
  );
}
