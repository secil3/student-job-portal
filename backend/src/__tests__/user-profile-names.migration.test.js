import { jest } from "@jest/globals";
import { ensureUserProfileNameSchema } from "../../scripts/migrate-user-profile-names.js";

const compatibleFullName = [
  {
    COLUMN_NAME: "full_name",
    COLUMN_TYPE: "varchar(150)",
    IS_NULLABLE: "YES",
    COLUMN_DEFAULT: null,
  },
];

const compatibleCompanyProfile = [
  {
    COLUMN_NAME: "user_id",
    COLUMN_TYPE: "int",
    IS_NULLABLE: "NO",
    COLUMN_DEFAULT: null,
  },
  {
    COLUMN_NAME: "company_name",
    COLUMN_TYPE: "varchar(255)",
    IS_NULLABLE: "NO",
    COLUMN_DEFAULT: null,
  },
  {
    COLUMN_NAME: "description",
    COLUMN_TYPE: "text",
    IS_NULLABLE: "YES",
    COLUMN_DEFAULT: null,
  },
];

const compatibleConstraints = [
  {
    CONSTRAINT_TYPE: "PRIMARY KEY",
    COLUMN_NAME: "user_id",
    REFERENCED_TABLE_NAME: null,
    REFERENCED_COLUMN_NAME: null,
  },
  {
    CONSTRAINT_TYPE: "FOREIGN KEY",
    COLUMN_NAME: "user_id",
    REFERENCED_TABLE_NAME: "users",
    REFERENCED_COLUMN_NAME: "id",
  },
];

const metadataConnection = ({
  userColumns = compatibleFullName,
  tableExists = true,
  profileColumns = compatibleCompanyProfile,
  constraints = compatibleConstraints,
} = {}) => ({
  query: jest.fn(async (sql) => {
    if (sql.includes("information_schema.COLUMNS") && sql.includes("TABLE_NAME = 'users'")) {
      return [userColumns];
    }
    if (sql.includes("information_schema.TABLES")) {
      return [tableExists ? [{ TABLE_NAME: "company_profiles" }] : []];
    }
    if (sql.includes("information_schema.COLUMNS") && sql.includes("TABLE_NAME = 'company_profiles'")) {
      return [profileColumns];
    }
    if (sql.includes("information_schema.TABLE_CONSTRAINTS")) {
      return [constraints];
    }
    return [{ affectedRows: 0 }];
  }),
});

describe("user profile name migration", () => {
  test("adds full_name and creates company_profiles without updating existing users", async () => {
    const connection = metadataConnection({ userColumns: [], tableExists: false });

    await ensureUserProfileNameSchema(connection);

    const statements = connection.query.mock.calls.map(([sql]) => sql);
    expect(statements.filter((sql) => sql.startsWith("ALTER TABLE"))).toHaveLength(1);
    expect(statements).toEqual(expect.arrayContaining([
      expect.stringContaining("`full_name` VARCHAR(150) NULL DEFAULT NULL"),
      expect.stringContaining("CREATE TABLE `company_profiles`"),
      expect.stringContaining("`company_name` VARCHAR(255) NOT NULL"),
      expect.stringContaining("FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)"),
    ]));
    expect(statements.some((sql) => /users.*company_name/i.test(sql))).toBe(false);
    expect(statements.some((sql) => /\bUPDATE\b/i.test(sql))).toBe(false);
  });

  test("is a no-op when the column and company profile table are compatible", async () => {
    const connection = metadataConnection();

    await ensureUserProfileNameSchema(connection);

    expect(connection.query).toHaveBeenCalledTimes(4);
    expect(connection.query.mock.calls.some(([sql]) =>
      sql.startsWith("ALTER TABLE") || sql.startsWith("CREATE TABLE")
    )).toBe(false);
  });

  test.each([
    ["type", { COLUMN_TYPE: "varchar(120)" }],
    ["nullability", { IS_NULLABLE: "NO" }],
    ["default", { COLUMN_DEFAULT: "Unknown" }],
  ])("stops before altering an incompatible existing column: %s", async (_label, change) => {
    const userColumns = compatibleFullName.map((column) => ({ ...column, ...change }));
    const connection = metadataConnection({ userColumns, tableExists: false });

    await expect(ensureUserProfileNameSchema(connection)).rejects.toThrow(
      "Incompatible schema for users.full_name"
    );
    expect(connection.query.mock.calls.some(([sql]) => sql.startsWith("ALTER TABLE"))).toBe(false);
    expect(connection.query.mock.calls.some(([sql]) => sql.startsWith("CREATE TABLE"))).toBe(false);
  });

  test("stops before DDL when an existing company profile table is incompatible", async () => {
    const profileColumns = compatibleCompanyProfile.filter(
      (column) => column.COLUMN_NAME !== "description"
    );
    const connection = metadataConnection({ userColumns: [], profileColumns });

    await expect(ensureUserProfileNameSchema(connection)).rejects.toThrow(
      "Incompatible schema for company_profiles.description"
    );
    expect(connection.query.mock.calls.some(([sql]) => sql.startsWith("ALTER TABLE"))).toBe(false);
    expect(connection.query.mock.calls.some(([sql]) => sql.startsWith("CREATE TABLE"))).toBe(false);
  });

  test("rejects a company profile table without the required primary and foreign keys", async () => {
    const connection = metadataConnection({ constraints: [] });

    await expect(ensureUserProfileNameSchema(connection)).rejects.toThrow(
      "Incompatible schema for company_profiles constraints"
    );
  });
});
