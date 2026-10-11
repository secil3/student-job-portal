// backend/src/config/db.js
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

let connection = null;

export async function getDB() {
  if (!connection) {
    // Relative certificate paths resolve from the backend working directory.
    // A configured file takes precedence; never silently fall back on read errors.
    const ssl = process.env.DB_SSL === "true" ? {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA_PATH
        ? { ca: readFileSync(process.env.DB_SSL_CA_PATH, "utf8") }
        : process.env.DB_SSL_CA
          ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") }
          : {}),
    } : undefined;

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "student_job_portal",
      ...(ssl ? { ssl } : {})
    });
  }
  return connection;
}

// Backward compatible: controllers can still do db.query(...)
const db = {
  query: async (...args) => {
    const conn = await getDB();
    return conn.query(...args);
  }
};

export default db;
