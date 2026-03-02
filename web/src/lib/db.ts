import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.WP_DB_HOST || "mysql",
      port: parseInt(process.env.WP_DB_PORT || "3306"),
      user: process.env.WP_DB_USER || "weaponpaints",
      password: process.env.WP_DB_PASS || "weaponpaints",
      database: process.env.WP_DB_NAME || "weaponpaints",
      waitForConnections: true,
      connectionLimit: 10,
      idleTimeout: 60000,
    });
  }
  return pool;
}

/**
 * Trigger an immediate skin refresh for a player by notifying the
 * WeaponPaints plugin's HTTP listener directly.
 */
export async function triggerRefresh(steamId: string): Promise<void> {
  const url = process.env.CS2_REFRESH_URL || "http://cs2:6157/refresh";
  try {
    await fetch(url, { method: "POST", body: steamId });
  } catch (err) {
    console.error(`[refresh] Failed to trigger refresh for ${steamId}:`, err);
  }
}
