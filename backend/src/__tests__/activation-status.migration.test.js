import { jest } from "@jest/globals";
import { ensureActivationStatusSchema } from "../../scripts/migrate-activation-status.js";

const compatibleRows = {
  users: [
    {
      COLUMN_NAME: "is_active",
      COLUMN_TYPE: "tinyint(1)",
      IS_NULLABLE: "NO",
      COLUMN_DEFAULT: "1",
    },
    {
      COLUMN_NAME: "deactivated_at",
      COLUMN_TYPE: "datetime",
      IS_NULLABLE: "YES",
      COLUMN_DEFAULT: null,
    },
  ],
  jobs: [
    {
      COLUMN_NAME: "is_active",
      COLUMN_TYPE: "tinyint(1)",
      IS_NULLABLE: "NO",
      COLUMN_DEFAULT: 1,
    },
    {
      COLUMN_NAME: "deactivated_at",
      COLUMN_TYPE: "datetime",
      IS_NULLABLE: "YES",
      COLUMN_DEFAULT: null,
    },
  ],
};

const metadataConnection = (rowsByTable) => ({
  query: jest.fn(async (sql, params) => {
    if (sql.includes("information_schema.COLUMNS")) {
      return [rowsByTable[params[0]] ?? []];
    }
    return [{ affectedRows: 0 }];
  }),
});

describe("activation status migration", () => {
  test("adds only missing columns and never updates existing rows", async () => {
    const connection = metadataConnection({ users: [], jobs: [] });

    await ensureActivationStatusSchema(connection);

    const statements = connection.query.mock.calls.map(([sql]) => sql);
    expect(statements.filter((sql) => sql.startsWith("ALTER TABLE"))).toHaveLength(4);
    expect(statements.some((sql) => /\bUPDATE\b/i.test(sql))).toBe(false);
    expect(statements).toEqual(expect.arrayContaining([
      expect.stringContaining("`users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1"),
      expect.stringContaining("`users` ADD COLUMN `deactivated_at` DATETIME NULL"),
      expect.stringContaining("`jobs` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1"),
      expect.stringContaining("`jobs` ADD COLUMN `deactivated_at` DATETIME NULL"),
    ]));
  });

  test("is a no-op when every column is already compatible", async () => {
    const connection = metadataConnection(compatibleRows);

    await ensureActivationStatusSchema(connection);

    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.query.mock.calls.every(([sql]) =>
      sql.includes("information_schema.COLUMNS")
    )).toBe(true);
  });

  test.each([
    ["type", { COLUMN_TYPE: "int" }],
    ["nullability", { IS_NULLABLE: "YES" }],
    ["default", { COLUMN_DEFAULT: "0" }],
  ])("stops before altering when an existing column has incompatible %s", async (_label, change) => {
    const rows = {
      users: compatibleRows.users.map((column) =>
        column.COLUMN_NAME === "is_active" ? { ...column, ...change } : column
      ),
      jobs: [],
    };
    const connection = metadataConnection(rows);

    await expect(ensureActivationStatusSchema(connection)).rejects.toThrow(
      "Incompatible schema for users.is_active"
    );

    expect(connection.query.mock.calls.some(([sql]) => sql.startsWith("ALTER TABLE"))).toBe(false);
  });
});
