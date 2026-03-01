import { NextRequest, NextResponse } from "next/server";
import {
  getSkins,
  getGloves,
  getMusic,
  getCollectibles,
  getKeychains,
  getStickers,
  getAgents,
} from "@/lib/items";
import { getWeaponCategory } from "@/lib/weapons";
import type { SkinItem } from "@/lib/types";

const VALID_CATEGORIES = [
  "pistols",
  "rifles",
  "smgs",
  "shotguns",
  "machineguns",
  "knives",
  "gloves",
  "music",
  "pins",
  "keychains",
  "stickers",
  "agents",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    let data: unknown;

    switch (category) {
      case "music":
        data = await getMusic();
        break;
      case "pins":
        data = await getCollectibles();
        break;
      case "keychains":
        data = await getKeychains();
        break;
      case "stickers":
        data = await getStickers();
        break;
      case "agents":
        data = await getAgents();
        break;
      case "gloves":
        data = await getGloves();
        break;
      default: {
        // Weapon categories — filter skins by defindex
        const allSkins = await getSkins();
        data = allSkins.filter((s: SkinItem) => {
          const cat = getWeaponCategory(s.weapon_defindex);
          return cat === category;
        });
        break;
      }
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load items" },
      { status: 500 }
    );
  }
}
