import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const getDBMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
  getDB: getDBMock,
}));

const { getResumeFile } = await import("../controllers/resume.controller.js");

const mockResponse = () => {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn((filePath, callback) => {
    callback?.();
    return res;
  });
  return res;
};

describe("Protected resume file access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 404 when the resume record does not exist", async () => {
    dbMock.query.mockResolvedValueOnce([[]]);
    const req = { params: { id: "99" }, user: { id: 1, role: "student" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  test("allows a student to open their own resume", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { id: 10, user_id: 1, file_path: "/uploads/resume.pdf" },
    ]]);
    const req = { params: { id: "10" }, user: { id: 1, role: "student" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.sendFile).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("denies a student access to another student's resume", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { id: 10, user_id: 2, file_path: "/uploads/resume.pdf" },
    ]]);
    const req = { params: { id: "10" }, user: { id: 1, role: "student" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  test("allows an employer through their own job application relation", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { id: 10, user_id: 1, file_path: "/uploads/resume.pdf" },
      ]])
      .mockResolvedValueOnce([[{ id: 20 }]]);
    const req = { params: { id: "10" }, user: { id: 5, role: "employer" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(dbMock.query).toHaveBeenLastCalledWith(
      expect.stringMatching(
        /j\.employer_id = \?[\s\S]*employer\.role = 'employer'[\s\S]*employer\.status = 'approved'[\s\S]*employer\.is_active = 1/
      ),
      [10, 5]
    );
    expect(res.sendFile).toHaveBeenCalledTimes(1);
  });

  test.each([
    "approval removed",
    "account inactive",
    "current role is no longer employer",
  ])("denies an employer when the current account has %s", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { id: 10, user_id: 1, file_path: "/uploads/resume.pdf" },
      ]])
      .mockResolvedValueOnce([[]]);
    const req = { params: { id: "10" }, user: { id: 5, role: "employer" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  test("denies an employer without an authorized application relation", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { id: 10, user_id: 1, file_path: "/uploads/resume.pdf" },
      ]])
      .mockResolvedValueOnce([[]]);
    const req = { params: { id: "10" }, user: { id: 5, role: "employer" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  test("rejects a stored path outside the uploads directory", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { id: 10, user_id: 1, file_path: "/uploads/../../secret.txt" },
    ]]);
    const req = { params: { id: "10" }, user: { id: 1, role: "student" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  test("denies roles other than student and employer", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { id: 10, user_id: 1, file_path: "/uploads/resume.pdf" },
    ]]);
    const req = { params: { id: "10" }, user: { id: 7, role: "admin" } };
    const res = mockResponse();

    await getResumeFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });
});
