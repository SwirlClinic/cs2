import { readFile } from "fs/promises";
import path from "path";
import type {
  SkinItem,
  GloveItem,
  MusicItem,
  CollectibleItem,
  KeychainItem,
  StickerItem,
  AgentItem,
} from "./types";

const DATA_DIR = process.env.WP_DATA_DIR || "/app/wp-data";

// In-memory cache: category → parsed JSON
const cache = new Map<string, { data: unknown; mtime: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const now = Date.now();
  const cached = cache.get(filename);
  if (cached && now - cached.mtime < CACHE_TTL) {
    return cached.data as T;
  }
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as T;
  cache.set(filename, { data, mtime: now });
  return data;
}

export async function getSkins(): Promise<SkinItem[]> {
  return loadJSON<SkinItem[]>("skins_en.json");
}

export async function getGloves(): Promise<GloveItem[]> {
  return loadJSON<GloveItem[]>("gloves_en.json");
}

export async function getMusic(): Promise<MusicItem[]> {
  return loadJSON<MusicItem[]>("music_en.json");
}

export async function getCollectibles(): Promise<CollectibleItem[]> {
  return loadJSON<CollectibleItem[]>("collectibles_en.json");
}

export async function getKeychains(): Promise<KeychainItem[]> {
  return loadJSON<KeychainItem[]>("keychains_en.json");
}

export async function getStickers(): Promise<StickerItem[]> {
  return loadJSON<StickerItem[]>("stickers_en.json");
}

export async function getAgents(): Promise<AgentItem[]> {
  return loadJSON<AgentItem[]>("agents_en.json");
}

// Get skins filtered by weapon_defindex
export async function getSkinsForWeapon(defindex: number): Promise<SkinItem[]> {
  const all = await getSkins();
  return all.filter((s) => s.weapon_defindex === defindex);
}
