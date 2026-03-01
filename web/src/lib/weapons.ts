import type { WeaponCategory } from "./types";

// weapon_defindex → category mapping
const WEAPON_CATEGORIES: Record<number, WeaponCategory> = {
  // Pistols
  1: "pistols",   // Desert Eagle
  2: "pistols",   // Dual Berettas
  3: "pistols",   // Five-SeveN
  4: "pistols",   // Glock-18
  30: "pistols",  // Tec-9
  32: "pistols",  // P2000
  36: "pistols",  // P250
  61: "pistols",  // USP-S
  63: "pistols",  // CZ75-Auto
  64: "pistols",  // R8 Revolver

  // Rifles
  7: "rifles",    // AK-47
  8: "rifles",    // AUG
  9: "rifles",    // AWP
  10: "rifles",   // FAMAS
  13: "rifles",   // Galil AR
  16: "rifles",   // M4A4
  38: "rifles",   // SCAR-20
  39: "rifles",   // SG 553
  40: "rifles",   // SSG 08
  60: "rifles",   // M4A1-S
  11: "rifles",   // G3SG1

  // SMGs
  17: "smgs",     // MAC-10
  19: "smgs",     // P90
  23: "smgs",     // MP5-SD
  24: "smgs",     // UMP-45
  25: "smgs",     // XM1014 — actually shotgun, moved below
  26: "smgs",     // PP-Bizon
  33: "smgs",     // MP7
  34: "smgs",     // MP9

  // Shotguns
  27: "shotguns", // MAG-7
  29: "shotguns", // Sawed-Off
  35: "shotguns", // Nova

  // Machine guns
  14: "machineguns", // M249
  28: "machineguns", // Negev
};

// Fix: XM1014 is a shotgun
WEAPON_CATEGORIES[25] = "shotguns";

// Knife defindexes
const KNIFE_DEFINDEXES = new Set([
  500, 503, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515,
  516, 517, 518, 519, 520, 521, 522, 523, 525, 526,
]);

// Glove defindexes
const GLOVE_DEFINDEXES = new Set([
  5027, 5028, 5029, 5030, 5031, 5032, 5033, 5034, 5035,
]);

export function getWeaponCategory(defindex: number): WeaponCategory | null {
  if (KNIFE_DEFINDEXES.has(defindex)) return "knives";
  if (GLOVE_DEFINDEXES.has(defindex)) return "gloves";
  return WEAPON_CATEGORIES[defindex] ?? null;
}

export function isKnifeDefindex(defindex: number): boolean {
  return KNIFE_DEFINDEXES.has(defindex);
}

// Weapon names for sidebar display
export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = {
  pistols: "Pistols",
  rifles: "Rifles",
  smgs: "SMGs",
  shotguns: "Shotguns",
  machineguns: "Machine Guns",
  knives: "Knives",
  gloves: "Gloves",
};

// Map weapon_name strings to human-readable names
export const WEAPON_NAMES: Record<string, string> = {
  weapon_deagle: "Desert Eagle",
  weapon_elite: "Dual Berettas",
  weapon_fiveseven: "Five-SeveN",
  weapon_glock: "Glock-18",
  weapon_tec9: "Tec-9",
  weapon_hkp2000: "P2000",
  weapon_p250: "P250",
  weapon_usp_silencer: "USP-S",
  weapon_cz75a: "CZ75-Auto",
  weapon_revolver: "R8 Revolver",
  weapon_ak47: "AK-47",
  weapon_aug: "AUG",
  weapon_awp: "AWP",
  weapon_famas: "FAMAS",
  weapon_galilar: "Galil AR",
  weapon_m4a1: "M4A4",
  weapon_m4a1_silencer: "M4A1-S",
  weapon_scar20: "SCAR-20",
  weapon_sg556: "SG 553",
  weapon_ssg08: "SSG 08",
  weapon_g3sg1: "G3SG1",
  weapon_mac10: "MAC-10",
  weapon_p90: "P90",
  weapon_mp5sd: "MP5-SD",
  weapon_ump45: "UMP-45",
  weapon_bizon: "PP-Bizon",
  weapon_mp7: "MP7",
  weapon_mp9: "MP9",
  weapon_xm1014: "XM1014",
  weapon_mag7: "MAG-7",
  weapon_sawedoff: "Sawed-Off",
  weapon_nova: "Nova",
  weapon_m249: "M249",
  weapon_negev: "Negev",
};

// Defindex → weapon_name lookup (reverse of what we need for skins)
export const DEFINDEX_TO_WEAPON: Record<number, string> = {
  1: "weapon_deagle",
  2: "weapon_elite",
  3: "weapon_fiveseven",
  4: "weapon_glock",
  7: "weapon_ak47",
  8: "weapon_aug",
  9: "weapon_awp",
  10: "weapon_famas",
  11: "weapon_g3sg1",
  13: "weapon_galilar",
  14: "weapon_m249",
  16: "weapon_m4a1",
  17: "weapon_mac10",
  19: "weapon_p90",
  23: "weapon_mp5sd",
  24: "weapon_ump45",
  25: "weapon_xm1014",
  26: "weapon_bizon",
  27: "weapon_mag7",
  28: "weapon_negev",
  29: "weapon_sawedoff",
  30: "weapon_tec9",
  32: "weapon_hkp2000",
  33: "weapon_mp7",
  34: "weapon_mp9",
  35: "weapon_nova",
  36: "weapon_p250",
  38: "weapon_scar20",
  39: "weapon_sg556",
  40: "weapon_ssg08",
  60: "weapon_m4a1_silencer",
  61: "weapon_usp_silencer",
  63: "weapon_cz75a",
  64: "weapon_revolver",
};
