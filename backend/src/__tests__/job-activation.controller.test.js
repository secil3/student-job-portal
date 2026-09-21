import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { updateJobActivation } = await import("../controllers/jobs.controller.js");
const { default: jobsRouter } = await import("../routes/jobs.routes.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = ({ userId = 7, jobId = "20", isActive = false } = {}) => ({
  user: { id: userId },
  params: { id: jobId },
  body: { isActive },
});

describe("Job activation authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("removes the permanent DELETE route and exposes activation PATCH", () => {
    const routes = jobsRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));

    expect(routes.some(({ methods }) => methods.delete)).toBe(false);
    expect(routes.some(({ path, methods }) =>
      path === "/:id/activation" && methods.patch
    )).toBe(true);
  });

  test.each([false, true])(
    "allows an approved active employer to set their own job active=%s",
    async (isActive) => {
      dbMock.query
        .mockResolvedValueOnce([[
          { role: "employer", status: "approved", is_active: 1 },
        ]])
        .mockResolvedValueOnce([[
          { id: 20, employer_id: 7, is_active: isActive ? 0 : 1 },
        ]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = mockResponse();

      await updateJobActivation(request({ isActive }), res);

      const [sql, params] = dbMock.query.mock.calls[2];
      expect(sql).toContain("UPDATE jobs");
      expect(sql).toContain("status = 'approved'");
      expect(sql).not.toContain("applications");
      expect(sql).not.toMatch(/\bDELETE\b/);
      expect(params).toEqual([isActive ? 1 : 0, isActive ? 1 : 0, "20", 7, 7]);
      expect(res.json).toHaveBeenCalledWith({
        message: isActive ? "Job reactivated successfully" : "Job deactivated successfully",
      });
    }
  );

  test("allows an active admin to deactivate any job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { role: "admin", status: "approved", is_active: 1 },
      ]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 9, is_active: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockResponse();

    await updateJobActivation(request({ userId: 2 }), res);

    expect(dbMock.query.mock.calls[2][0]).toContain("role = 'admin'");
    expect(res.json).toHaveBeenCalledWith({ message: "Job deactivated successfully" });
  });

  test("blocks an employer from changing another employer's job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { role: "employer", status: "approved", is_active: 1 },
      ]])
      .mockResolvedValueOnce([[{ id: 20, employer_id: 8, is_active: 1 }]]);
    const res = mockResponse();

    await updateJobActivation(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("blocks a student from changing job activation", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "student", status: "approved", is_active: 1 },
    ]]);
    const res = mockResponse();

    await updateJobActivation(request({ userId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["pending", 1],
    ["rejected", 1],
    ["approved", 0],
  ])("blocks an employer with status %s and active=%s", async (status, isActive) => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "employer", status, is_active: isActive },
    ]]);
    const res = mockResponse();

    await updateJobActivation(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test.each([false, true])("treats a repeated active=%s request as a successful no-op", async (isActive) => {
    dbMock.query
      .mockResolvedValueOnce([[
        { role: "employer", status: "approved", is_active: 1 },
      ]])
      .mockResolvedValueOnce([[
        { id: 20, employer_id: 7, is_active: isActive ? 1 : 0 },
      ]]);
    const res = mockResponse();

    await updateJobActivation(request({ isActive }), res);

    expect(res.json).toHaveBeenCalledWith({
      message: isActive ? "Job is already active" : "Job is already inactive",
    });
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("returns 404 for a missing job", async () => {
    dbMock.query
      .mockResolvedValueOnce([[
        { role: "admin", status: "approved", is_active: 1 },
      ]])
      .mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await updateJobActivation(request({ userId: 2, jobId: "404" }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("rejects a non-boolean activation value", async () => {
    const req = request();
    req.body.isActive = "false";
    const res = mockResponse();

    await updateJobActivation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });
});
