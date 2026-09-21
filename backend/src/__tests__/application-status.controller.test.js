import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { updateApplicationStatus } = await import(
  "../controllers/application.controller.js"
);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Employer application status updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(["accepted", "rejected"])(
    "updates an owned application to %s",
    async (status) => {
      dbMock.query
        .mockResolvedValueOnce([[
          { role: "employer", status: "approved" },
        ]])
        .mockResolvedValueOnce([[
          { id: 14, status: "pending", employer_id: 8 },
        ]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const req = {
        user: { id: 8, role: "employer" },
        params: { id: "14" },
        body: { status },
      };
      const res = mockResponse();

      await updateApplicationStatus(req, res);

      expect(dbMock.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("j.employer_id = ?"),
        [status, "14", 8, 8]
      );
      expect(res.json).toHaveBeenCalledWith({ message: "Status updated ✅" });
    }
  );

  test("rejects an application owned by another employer", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[
        { id: 14, status: "pending", employer_id: 9 },
      ]]);
    const req = {
      user: { id: 8, role: "employer" },
      params: { id: "14" },
      body: { status: "accepted" },
    };
    const res = mockResponse();

    await updateApplicationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("allows changing a previous decision", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[
        { id: 14, status: "accepted", employer_id: 8 },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const req = {
      user: { id: 8, role: "employer" },
      params: { id: "14" },
      body: { status: "rejected" },
    };
    const res = mockResponse();

    await updateApplicationStatus(req, res);

    expect(dbMock.query).toHaveBeenCalledTimes(3);
    expect(res.json).toHaveBeenCalledWith({ message: "Status updated ✅" });
  });

  test("returns 404 for a missing application", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[]]);
    const req = {
      user: { id: 8, role: "employer" },
      params: { id: "404" },
      body: { status: "rejected" },
    };
    const res = mockResponse();

    await updateApplicationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test.each(["pending", "invalid"])(
    "rejects the %s status",
    async (status) => {
      const req = {
        user: { id: 8, role: "employer" },
        params: { id: "14" },
        body: { status },
      };
      const res = mockResponse();

      await updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(dbMock.query).not.toHaveBeenCalled();
    }
  );

  test.each(["pending", "rejected"])(
    "blocks a %s employer from updating an application",
    async (accountStatus) => {
      dbMock.query.mockResolvedValueOnce([[
        { role: "employer", status: accountStatus },
      ]]);
      const req = {
        user: { id: 8, role: "employer" },
        params: { id: "14" },
        body: { status: "accepted" },
      };
      const res = mockResponse();

      await updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Employer account is not approved",
      });
      expect(dbMock.query).toHaveBeenCalledTimes(1);
    }
  );
});
