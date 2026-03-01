// ---- Item catalog types (from JSON files) ----

export interface SkinItem {
  weapon_defindex: number;
  weapon_name: string;
  paint: number | string;
  image: string;
  paint_name: string;
}

export interface GloveItem {
  weapon_defindex: number;
  paint: number | string;
  image: string;
  paint_name: string;
}

export interface MusicItem {
  id: string;
  name: string;
  image: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  image: string;
}

export interface KeychainItem {
  id: string;
  name: string;
  image: string;
}

export interface StickerItem {
  id: string;
  name: string;
  image: string;
}

export interface AgentItem {
  team: number;
  image: string;
  model: string;
  agent_name: string;
}

// ---- Database row types ----

export interface PlayerSkin {
  steamid: string;
  weapon_team: number;
  weapon_defindex: number;
  weapon_paint_id: number;
  weapon_wear: number;
  weapon_seed: number;
  weapon_nametag: string;
  weapon_stattrak: number;
  weapon_stattrak_count: number;
  weapon_sticker_0: string;
  weapon_sticker_1: string;
  weapon_sticker_2: string;
  weapon_sticker_3: string;
  weapon_sticker_4: string;
  weapon_keychain: string;
}

export interface PlayerKnife {
  steamid: string;
  weapon_team: number;
  knife: string;
}

export interface PlayerGlove {
  steamid: string;
  weapon_team: number;
  weapon_defindex: number;
}

export interface PlayerAgent {
  steamid: string;
  agent_ct: string;
  agent_t: string;
}

export interface PlayerMusic {
  steamid: string;
  weapon_team: number;
  music_id: number;
}

export interface PlayerPin {
  steamid: string;
  weapon_team: number;
  id: number;
}

// ---- Session ----

export interface SessionData {
  steamId?: string;
  username?: string;
  avatar?: string;
}

// ---- Loadout ----

export interface Loadout {
  skins: PlayerSkin[];
  knife: PlayerKnife[];
  gloves: PlayerGlove[];
  agents: PlayerAgent | null;
  music: PlayerMusic[];
  pins: PlayerPin[];
}

// ---- Weapon categories ----

export type WeaponCategory =
  | "pistols"
  | "rifles"
  | "smgs"
  | "shotguns"
  | "machineguns"
  | "knives"
  | "gloves";
