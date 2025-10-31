import mysql from "mysql2/promise";

const config = {
  host: process.env.MYSQL_HOST ?? "localhost",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "calming_app",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
};

let pool;

if (!globalThis.__calming_mysql_pool) {
  pool = mysql.createPool(config);
  globalThis.__calming_mysql_pool = pool;
} else {
  pool = globalThis.__calming_mysql_pool;
}

export default pool;

export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
