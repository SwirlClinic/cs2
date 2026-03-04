import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;
let migrated = false;

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
    if (!migrated) {
      migrated = true;
      runMigrations(pool).catch((err) =>
        console.error("[db] Migration failed:", err)
      );
    }
  }
  return pool;
}

async function runMigrations(p: mysql.Pool) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS css_admins (
      id INT NOT NULL AUTO_INCREMENT,
      steamid VARCHAR(18) NOT NULL,
      player_name VARCHAR(128) DEFAULT '',
      flags TEXT NOT NULL,
      immunity INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY steamid (steamid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS vip_groups (
      id INT NOT NULL AUTO_INCREMENT,
      group_name VARCHAR(64) NOT NULL,
      perks JSON,
      weapons TEXT,
      PRIMARY KEY (id),
      UNIQUE KEY group_name (group_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  // Migrate old fixed-column schema to JSON perks
  await migrateVipGroupsPerks(p);
  await p.query(`
    CREATE TABLE IF NOT EXISTS vip_players (
      id INT NOT NULL AUTO_INCREMENT,
      steamid VARCHAR(18) NOT NULL,
      player_name VARCHAR(128) DEFAULT '',
      vip_group VARCHAR(64) NOT NULL,
      expire_date DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY steamid (steamid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  console.log("[db] Migrations complete");
}

async function migrateVipGroupsPerks(p: mysql.Pool) {
  try {
    const [cols] = await p.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vip_groups' AND COLUMN_NAME = 'health_bonus'"
    );
    if (!Array.isArray(cols) || cols.length === 0) return; // already migrated

    // Add perks column if missing
    const [perksCols] = await p.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vip_groups' AND COLUMN_NAME = 'perks'"
    );
    if (!Array.isArray(perksCols) || perksCols.length === 0) {
      await p.query("ALTER TABLE vip_groups ADD COLUMN perks JSON AFTER group_name");
    }

    // Read existing rows and convert to JSON perks
    const [rows] = await p.query("SELECT id, health_bonus, armor_on_spawn, helmet_on_spawn, grenade_count, defuser_on_spawn, extra_money_per_round FROM vip_groups") as [any[], any];
    for (const row of rows) {
      const perks: Record<string, number | boolean> = {};
      if (row.health_bonus > 0) perks.health_bonus = row.health_bonus;
      if (row.armor_on_spawn) perks.armor = true;
      if (row.helmet_on_spawn) perks.helmet = true;
      if (row.defuser_on_spawn) perks.defuser = true;
      if (row.extra_money_per_round > 0) perks.extra_money = row.extra_money_per_round;
      if (row.grenade_count > 0) perks.weapon_hegrenade = row.grenade_count;
      await p.query("UPDATE vip_groups SET perks = ? WHERE id = ?", [JSON.stringify(perks), row.id]);
    }

    // Drop old columns
    await p.query("ALTER TABLE vip_groups DROP COLUMN health_bonus, DROP COLUMN armor_on_spawn, DROP COLUMN helmet_on_spawn, DROP COLUMN grenade_count, DROP COLUMN defuser_on_spawn, DROP COLUMN extra_money_per_round");
    console.log("[db] Migrated vip_groups to JSON perks");
  } catch (err) {
    console.error("[db] Perks migration error:", err);
  }
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
