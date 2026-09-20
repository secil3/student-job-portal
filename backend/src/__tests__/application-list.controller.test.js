import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { getApplicationsByJob } = await import(
  "../controllers/application.controller.js"
);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = {
  user: { id: 8, role: "employer" },
  params: { jobId: "20" },
};

describe("Employer application list ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns applications for an owned job", async () => {
    const applications = [{ id: 14, status: "pending", resume_id: 5 }];
    dbMock.query
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]])
      .mockResolvedValueOnce([applications]);
    const res = mockResponse();

    await getApplicationsByJob(request, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("j.employer_id = ?"),
      ["20", 8]
    );
    expect(res.json).toHaveBeenCalledWith(applications);
  });

  test("returns an empty list for an owned job without applications", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8 }]])
      .mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await getApplicationsByJob(request, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 403 for another employer's job", async () => {
    dbMock.query.mockResolvedValueOnce([[{ id: 20, employer_id: 9 }]]);
    const res = mockResponse();

    await getApplicationsByJob(request, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("returns 404 for a missing job", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await getApplicationsByJob(request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("returns a safe 500 response when the database fails", async () => {
    dbMock.query.mockRejectedValueOnce({ code: "ER_TEST_FAILURE" });
    const res = mockResponse();

    await getApplicationsByJob(request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch applications" });
  });
});
