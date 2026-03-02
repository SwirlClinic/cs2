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
 * Queue a skin refresh for a player. The WeaponPaints plugin polls this table
 * and applies the refresh in-game automatically.
 */
export async function queueRefresh(steamId: string): Promise<void> {
  try {
    const p = getPool();
    await p.query(
      `INSERT IGNORE INTO wp_refresh_queue (steamid) VALUES (?)`,
      [steamId]
    );
  } catch (err) {
    console.error(`[refresh-queue] Failed to queue refresh for ${steamId}:`, err);
  }
}
