// backend/src/config/db.js
import mysql from "mysql2/promise";

let connection = null;

export async function getDB() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "student_job_portal"
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
