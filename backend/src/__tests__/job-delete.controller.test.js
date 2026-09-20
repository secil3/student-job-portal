import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { deleteJob } = await import("../controllers/jobs.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Job deletion authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("blocks students before reading the job", async () => {
    dbMock.query.mockResolvedValueOnce([[{ role: "student" }]]);
    const req = { user: { id: 4 }, params: { id: "20" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("allows an employer to delete their own job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 7 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const req = { user: { id: 7 }, params: { id: "20" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("employer_id = ?"),
      ["20", 7, 7]
    );
    expect(res.json).toHaveBeenCalledWith({
      message: "Job and its applications were deleted",
    });
  });

  test("blocks an employer from deleting another employer's job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]]);
    const req = { user: { id: 7 }, params: { id: "20" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("allows an admin to delete a job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const req = { user: { id: 2 }, params: { id: "20" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("role = 'admin'"),
      ["20", 2]
    );
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("returns 404 when the job does not exist", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer" }]])
      .mockResolvedValueOnce([[]]);
    const req = { user: { id: 7 }, params: { id: "404" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("does not report success when the database delete fails", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin" }]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]])
      .mockRejectedValueOnce({ code: "ER_TEST_FAILURE" });
    const req = { user: { id: 2 }, params: { id: "20" } };
    const res = mockResponse();

    await deleteJob(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Job could not be deleted",
    });
  });
});
