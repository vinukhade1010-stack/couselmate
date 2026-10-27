import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * A pool keeps several MySQL connections open and lends one out for each query,
 * so we do not pay the cost of opening a new connection every time.
 * (In Foodie we opened a new JDBC connection per call. This is the upgrade.)
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,      // DECIMAL columns come back as numbers, not strings
});

/**
 * Runs a SQL statement. The ? marks are placeholders: the values travel separately from the
 * SQL text and are escaped by the driver, so user input can never change the query (no SQL injection).
 */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Runs several statements as one unit: all succeed, or all are undone (like commit/rollback in Foodie). */
export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function connectDB() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('MySQL connected');
}
