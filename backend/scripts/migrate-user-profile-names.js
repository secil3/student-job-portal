import "dotenv/config";
import { pathToFileURL } from "node:url";
import { getDB } from "../src/config/db.js";

const fullNameColumn = {
  type: "varchar(150)",
  nullable: "YES",
  defaultValue: null,
};

const companyProfileColumns = {
  user_id: { type: "int", nullable: "NO", defaultValue: null },
  company_name: { type: "varchar(255)", nullable: "NO", defaultValue: null },
  description: { type: "text", nullable: "YES", defaultValue: null },
};

const assertColumnCompatible = (tableName, columnName, actual, expected) => {
  const typeMatches = actual.COLUMN_TYPE.toLowerCase() === expected.type;
  const nullMatches = actual.IS_NULLABLE === expected.nullable;
  const defaultMatches = actual.COLUMN_DEFAULT === expected.defaultValue;

  if (!typeMatches || !nullMatches || !defaultMatches) {
    throw new Error(
      `Incompatible schema for ${tableName}.${columnName}; migration stopped without modifying it`
    );
  }
};

const assertCompanyProfileConstraints = (constraints) => {
  const hasPrimaryKey = constraints.some((constraint) =>
    constraint.CONSTRAINT_TYPE === "PRIMARY KEY"
    && constraint.COLUMN_NAME === "user_id"
  );
  const hasUserForeignKey = constraints.some((constraint) =>
    constraint.CONSTRAINT_TYPE === "FOREIGN KEY"
    && constraint.COLUMN_NAME === "user_id"
    && constraint.REFERENCED_TABLE_NAME === "users"
    && constraint.REFERENCED_COLUMN_NAME === "id"
  );

  if (!hasPrimaryKey || !hasUserForeignKey) {
    throw new Error(
      "Incompatible schema for company_profiles constraints; migration stopped without modifying it"
    );
  }
};

export const ensureUserProfileNameSchema = async (connection) => {
  const [userColumns] = await connection.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'full_name'`
  );

  if (userColumns[0]) {
    assertColumnCompatible("users", "full_name", userColumns[0], fullNameColumn);
  }

  const [tables] = await connection.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'company_profiles'`
  );
  const companyProfilesExists = tables.length === 1;

  if (companyProfilesExists) {
    const [profileColumns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'company_profiles'`
    );
    const existingColumns = new Map(
      profileColumns.map((column) => [column.COLUMN_NAME, column])
    );

    for (const [columnName, expected] of Object.entries(companyProfileColumns)) {
      const actual = existingColumns.get(columnName);
      if (!actual) {
        throw new Error(
          `Incompatible schema for company_profiles.${columnName}; migration stopped without modifying it`
        );
      }
      assertColumnCompatible("company_profiles", columnName, actual, expected);
    }

    const [constraints] = await connection.query(
      `SELECT tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME,
              kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.KEY_COLUMN_USAGE kcu
         ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
        AND tc.TABLE_NAME = kcu.TABLE_NAME
        AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
         AND tc.TABLE_NAME = 'company_profiles'`
    );
    assertCompanyProfileConstraints(constraints);
  }

  // Validate every existing object before executing either DDL statement.
  if (!userColumns[0]) {
    await connection.query(
      "ALTER TABLE `users` ADD COLUMN `full_name` VARCHAR(150) NULL DEFAULT NULL"
    );
  }

  if (!companyProfilesExists) {
    await connection.query(
      `CREATE TABLE \`company_profiles\` (
         \`user_id\` INT NOT NULL,
         \`company_name\` VARCHAR(255) NOT NULL,
         \`description\` TEXT DEFAULT NULL,
         PRIMARY KEY (\`user_id\`),
         CONSTRAINT \`company_profiles_user_fk\`
           FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
  }
};

const run = async () => {
  const connection = await getDB();
  try {
    await ensureUserProfileNameSchema(connection);
    console.log("User and company profile schema is ready");
  } finally {
    await connection.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
