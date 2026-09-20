import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { applyToJob, getApplicationsByJob, getStudentApplications } = await import(
  "../controllers/application.controller.js"
);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Application resume relation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores a resume owned by the applying student", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ id: 12, user_id: 7 }]])
      .mockResolvedValueOnce([{ insertId: 30 }]);
    const req = {
      user: { id: 7, role: "student" },
      body: { jobId: 4, resumeId: 12 },
    };
    const res = mockResponse();

    await applyToJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("resume_id"),
      [4, 7, 12]
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("requires a resume selection", async () => {
    const req = {
      user: { id: 7, role: "student" },
      body: { jobId: 4 },
    };
    const res = mockResponse();

    await applyToJob(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("rejects a resume owned by another student", async () => {
    dbMock.query.mockResolvedValueOnce([[{ id: 12, user_id: 8 }]]);
    const req = {
      user: { id: 7, role: "student" },
      body: { jobId: 4, resumeId: 12 },
    };
    const res = mockResponse();

    await applyToJob(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("returns not found for a missing resume", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const req = {
      user: { id: 7, role: "student" },
      body: { jobId: 4, resumeId: 999 },
    };
    const res = mockResponse();

    await applyToJob(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("returns conflict for a duplicate application", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ id: 12, user_id: 7 }]])
      .mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
    const req = {
      user: { id: 7, role: "student" },
      body: { jobId: 4, resumeId: 12 },
    };
    const res = mockResponse();

    await applyToJob(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test("includes job_id in the student application response", async () => {
    const applications = [{
      application_id: 30,
      job_id: 4,
      status: "pending",
      applied_at: "2026-01-01T00:00:00.000Z",
      job_title: "Synthetic Job",
    }];
    dbMock.query.mockResolvedValueOnce([applications]);
    const req = { user: { id: 7, role: "student" } };
    const res = mockResponse();

    await getStudentApplications(req, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining("a.job_id AS job_id"),
      [7]
    );
    expect(res.json).toHaveBeenCalledWith(applications);
  });

  test("includes the stored resume relation in the employer job response", async () => {
    const applications = [{ id: 30, resume_id: 12, resume_name: "CV" }];
    dbMock.query
      .mockResolvedValueOnce([[{ id: 4, employer_id: 9 }]])
      .mockResolvedValueOnce([applications]);
    const req = { user: { id: 9 }, params: { jobId: "4" } };
    const res = mockResponse();

    await getApplicationsByJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("r.id AS resume_id"),
      ["4", 9]
    );
    expect(res.json).toHaveBeenCalledWith(applications);
  });
});
