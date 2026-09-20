import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock
}));

const { updateProfile } = await import("../controllers/student.controller.js");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const studentRequest = (body) => ({
  user: { id: 7, role: "student" },
  body
});

describe("Student profile update validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(["0", "0.00", "3.5", "3.99", "4", "4.00", 2.75])(
    "accepts valid GPA %p",
    async (GPA) => {
      dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = mockRes();

      await updateProfile(studentRequest({ university: "Test University", major: "Engineering", GPA }), res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: "Profile updated successfully" });
      expect(dbMock.query).toHaveBeenCalledWith(
        "UPDATE users SET university = ?, major = ?, GPA = ? WHERE id = ?",
        ["Test University", "Engineering", Number(GPA), 7]
      );
    }
  );

  test.each(["-0.01", "4.01", "3.141", "not-a-number", {}, NaN])(
    "rejects invalid GPA %p with 400",
    async (GPA) => {
      const res = mockRes();

      await updateProfile(studentRequest({ university: "Test", major: "Test", GPA }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(dbMock.query).not.toHaveBeenCalled();
    }
  );

  test("stores blank optional fields as NULL", async () => {
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockRes();

    await updateProfile(studentRequest({ university: "  ", major: "", GPA: "" }), res);

    expect(dbMock.query).toHaveBeenCalledWith(
      "UPDATE users SET university = ?, major = ?, GPA = ? WHERE id = ?",
      [null, null, null, 7]
    );
  });

  test.each([
    {
      body: { university: "", major: "Engineering", GPA: "3.25" },
      expected: [null, "Engineering", 3.25, 7]
    },
    {
      body: { university: "Test University", major: "", GPA: "3.25" },
      expected: ["Test University", null, 3.25, 7]
    },
    {
      body: { university: "Test University", major: "Engineering", GPA: "" },
      expected: ["Test University", "Engineering", null, 7]
    }
  ])("stores each optional blank field as NULL", async ({ body, expected }) => {
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockRes();

    await updateProfile(studentRequest(body), res);

    expect(dbMock.query).toHaveBeenCalledWith(
      "UPDATE users SET university = ?, major = ?, GPA = ? WHERE id = ?",
      expected
    );
    expect(res.status).not.toHaveBeenCalled();
  });

  test.each([
    { university: "u".repeat(256), major: "Valid" },
    { university: "Valid", major: "m".repeat(256) },
    { university: 123, major: "Valid" }
  ])("rejects invalid text fields with 400", async (body) => {
    const res = mockRes();

    await updateProfile(studentRequest({ ...body, GPA: "3.00" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("returns 500 when the database update fails", async () => {
    dbMock.query.mockRejectedValueOnce(new Error("database unavailable"));
    const res = mockRes();

    await updateProfile(studentRequest({ university: "Test", major: "Test", GPA: "3.00" }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to update profile" });
  });
});
