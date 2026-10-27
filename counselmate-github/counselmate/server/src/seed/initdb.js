// Run with:  npm run initdb
// Creates the database and the tables (same as running sql/schema.sql in Workbench).
// Safe to run again: nothing is deleted.
import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const tablesSql = fs.readFileSync(new URL('../../../sql/tables.sql', import.meta.url), 'utf8');

const conn = await mysql.createConnection({
  host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password,
  multipleStatements: true,      // only here, for our own trusted SQL file. Never used for user input.
});
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${env.db.name}\``);
await conn.query(tablesSql);
await conn.end();
console.log(`Database "${env.db.name}" and its tables are ready.`);
