import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { createJob } = await import("../controllers/jobs.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const jobBody = {
  title: "Test Job",
  description: "Synthetic description",
  location: "Remote",
  salary: "1000",
};

describe("Job creation authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("allows an approved employer to create a job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([{ insertId: 25 }]);
    const req = { user: { id: 7 }, body: jobBody };
    const res = mockResponse();

    await createJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO jobs"),
      ["Test Job", "Synthetic description", "Remote", "1000", 7]
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test.each([
    ["pending", "Employer account approval is pending"],
    ["rejected", "Employer account is not approved"],
  ])("blocks an employer whose status is %s", async (status, message) => {
    dbMock.query.mockResolvedValueOnce([[{ role: "employer", status }]]);
    const req = { user: { id: 7 }, body: jobBody };
    const res = mockResponse();

    await createJob(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message });
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test.each(["student", "admin"])(
    "blocks a user with the %s role",
    async (role) => {
      dbMock.query.mockResolvedValueOnce([[{ role, status: "approved" }]]);
      const req = { user: { id: 7 }, body: jobBody };
      const res = mockResponse();

      await createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(dbMock.query).toHaveBeenCalledTimes(1);
    }
  );

  test("ignores a forged employer_id from the request body", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "employer", status: "approved" }]])
      .mockResolvedValueOnce([{ insertId: 25 }]);
    const req = {
      user: { id: 7 },
      body: { ...jobBody, employer_id: 999 },
    };
    const res = mockResponse();

    await createJob(req, res);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO jobs"),
      expect.arrayContaining([7])
    );
    expect(dbMock.query.mock.calls[1][1]).not.toContain(999);
  });
});
