import "dotenv/config";
import { getDB } from "../src/config/db.js";

const columns = {
  email_verification_token_hash: "CHAR(64) DEFAULT NULL",
  email_verification_token_expires: "DATETIME DEFAULT NULL",
};

const connection = await getDB();

try {
  for (const [columnName, definition] of Object.entries(columns)) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = ?`,
      [columnName]
    );

    if (Number(rows[0].total) === 0) {
      await connection.query(
        `ALTER TABLE users ADD COLUMN ${columnName} ${definition}`
      );
    }
  }

  await connection.query(
    "ALTER TABLE users MODIFY COLUMN is_verified TINYINT(1) DEFAULT 0"
  );

  console.log("Email verification schema is ready");
} finally {
  await connection.end();
}
