import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { getAllJobs } = await import("../controllers/jobs.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Job list visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows students only jobs owned by currently approved employers", async () => {
    const jobs = [{ id: 4, title: "Approved employer job" }];
    dbMock.query
      .mockResolvedValueOnce([[{ role: "student" }]])
      .mockResolvedValueOnce([jobs]);
    const req = { user: { id: 7, role: "student" } };
    const res = mockResponse();

    await getAllJobs(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      1,
      "SELECT role FROM users WHERE id = ?",
      [7]
    );
    expect(dbMock.query.mock.calls[1][0]).toContain("users.role = 'employer'");
    expect(dbMock.query.mock.calls[1][0]).toContain("users.status = 'approved'");
    expect(dbMock.query.mock.calls[1][0]).toContain("users.is_active = 1");
    expect(dbMock.query.mock.calls[1][0]).toContain("jobs.is_active = 1");
    expect(res.json).toHaveBeenCalledWith(jobs);
  });

  test("keeps the admin job list unfiltered by employer approval", async () => {
    const jobs = [{ id: 4 }, { id: 5 }];
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin" }]])
      .mockResolvedValueOnce([jobs]);
    const req = { user: { id: 2, role: "admin" } };
    const res = mockResponse();

    await getAllJobs(req, res);

    expect(dbMock.query.mock.calls[1][0]).not.toContain("users.status = 'approved'");
    expect(dbMock.query.mock.calls[1][0]).not.toContain("jobs.is_active = 1");
    expect(res.json).toHaveBeenCalledWith(jobs);
  });

  test("returns unauthorized when the current account no longer exists", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const req = { user: { id: 99, role: "student" } };
    const res = mockResponse();

    await getAllJobs(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });
});
