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
