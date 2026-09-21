import "dotenv/config";
import { pathToFileURL } from "node:url";
import { getDB } from "../src/config/db.js";

const schema = {
  users: {
    is_active: {
      definition: "TINYINT(1) NOT NULL DEFAULT 1",
      type: "tinyint(1)",
      nullable: "NO",
      defaultValue: "1",
    },
    deactivated_at: {
      definition: "DATETIME NULL",
      type: "datetime",
      nullable: "YES",
      defaultValue: null,
    },
  },
  jobs: {
    is_active: {
      definition: "TINYINT(1) NOT NULL DEFAULT 1",
      type: "tinyint(1)",
      nullable: "NO",
      defaultValue: "1",
    },
    deactivated_at: {
      definition: "DATETIME NULL",
      type: "datetime",
      nullable: "YES",
      defaultValue: null,
    },
  },
};

const normalizedDefault = (value) => value === null ? null : String(value);

const assertCompatible = (tableName, columnName, actual, expected) => {
  const typeMatches = actual.COLUMN_TYPE.toLowerCase() === expected.type;
  const nullMatches = actual.IS_NULLABLE === expected.nullable;
  const defaultMatches = normalizedDefault(actual.COLUMN_DEFAULT) === expected.defaultValue;

  if (!typeMatches || !nullMatches || !defaultMatches) {
    throw new Error(
      `Incompatible schema for ${tableName}.${columnName}; migration stopped without modifying it`
    );
  }
};

export const ensureActivationStatusSchema = async (connection) => {
  const missingColumns = [];

  // Validate every existing column before making any schema changes.
  for (const [tableName, columns] of Object.entries(schema)) {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME IN (?, ?)`,
      [tableName, ...Object.keys(columns)]
    );
    const existingColumns = new Map(rows.map((row) => [row.COLUMN_NAME, row]));

    for (const [columnName, expected] of Object.entries(columns)) {
      const actual = existingColumns.get(columnName);
      if (actual) {
        assertCompatible(tableName, columnName, actual, expected);
      } else {
        missingColumns.push({ tableName, columnName, definition: expected.definition });
      }
    }
  }

  for (const { tableName, columnName, definition } of missingColumns) {
    await connection.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
    );
  }
};

const run = async () => {
  const connection = await getDB();
  try {
    await ensureActivationStatusSchema(connection);
    console.log("Activation status schema is ready");
  } finally {
    await connection.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
