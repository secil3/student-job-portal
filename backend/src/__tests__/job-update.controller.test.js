import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { updateJob } = await import("../controllers/jobs.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const jobBody = {
  title: "Updated Job",
  description: "Updated synthetic description",
  location: "Remote",
  salary: "2000",
};

const request = (overrides = {}) => ({
  user: { id: 7 },
  params: { id: "20" },
  body: jobBody,
  ...overrides,
});

describe("Job update authorization and validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("allows an approved employer to update their own job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 7 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("WHERE id = ? AND employer_id = ?"),
      ["Updated Job", "Updated synthetic description", "Remote", "2000", "20", 7, 7]
    );
    expect(dbMock.query.mock.calls[2][0]).toContain("status = 'approved'");
    expect(res.json).toHaveBeenCalledWith({ message: "Job updated successfully" });
  });

  test.each(["pending", "rejected"])("blocks a %s employer", async (status) => {
    dbMock.query.mockResolvedValueOnce([[{ role: "employer", status }]]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test.each(["student", "admin"])("blocks a user with the %s role", async (role) => {
    dbMock.query.mockResolvedValueOnce([[{ role, status: "approved" }]]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("returns 403 for another employer's job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("returns 404 for a missing job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test.each([
    [{ ...jobBody, title: "" }, "Title is required"],
    [{ ...jobBody, description: 123 }, "Description must be text"],
    [{ ...jobBody, location: "x".repeat(101) }, "Location must be at most 100 characters"],
    [{ ...jobBody, salary: "x".repeat(51) }, "Salary must be at most 50 characters"],
  ])("returns 400 for invalid fields", async (body, message) => {
    dbMock.query.mockResolvedValueOnce([[{ role: "employer", status: "approved" }]]);
    const res = mockResponse();

    await updateJob(request({ body }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message });
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("does not report success when the constrained update affects no row", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 7 }]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockResponse();

    await updateJob(request(), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Job could not be updated" });
  });
});
