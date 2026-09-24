import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { getPendingEmployers, updateEmployerStatus } = await import(
  "../controllers/admin.controller.js"
);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Admin employer approval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns pending employers with their authoritative company profile", async () => {
    const employers = [{
      id: 12,
      email: "employer@example.test",
      full_name: "Demo Employer",
      company_name: "Demo Company",
    }];
    dbMock.query.mockResolvedValueOnce([employers]);
    const res = mockResponse();

    await getPendingEmployers({}, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringMatching(/LEFT JOIN company_profiles cp ON cp\.user_id = u\.id/)
    );
    expect(res.json).toHaveBeenCalledWith(employers);
  });

  test.each(["approved", "rejected"])(
    "updates an employer status to %s",
    async (status) => {
      dbMock.query
        .mockResolvedValueOnce([[{ role: "employer" }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const req = { params: { id: "12" }, body: { status } };
      const res = mockResponse();

      await updateEmployerStatus(req, res);

      expect(dbMock.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("role = 'employer'"),
        [status, "12"]
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Employer status updated successfully",
      });
    }
  );

  test.each(["student", "admin"])(
    "does not change a %s account",
    async (role) => {
      dbMock.query.mockResolvedValueOnce([[{ role }]]);
      const req = {
        params: { id: "12" },
        body: { status: "approved", role: "employer", userId: "999" },
      };
      const res = mockResponse();

      await updateEmployerStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(dbMock.query).toHaveBeenCalledTimes(1);
    }
  );

  test("returns 404 when the target account does not exist", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const req = { params: { id: "404" }, body: { status: "approved" } };
    const res = mockResponse();

    await updateEmployerStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("rejects an invalid status before querying the database", async () => {
    const req = { params: { id: "12" }, body: { status: "pending" } };
    const res = mockResponse();

    await updateEmployerStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("reports a conflict if the constrained update affects no employer", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer" }]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);
    const req = { params: { id: "12" }, body: { status: "approved" } };
    const res = mockResponse();

    await updateEmployerStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
