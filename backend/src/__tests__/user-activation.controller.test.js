import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

const { updateUserActivation } = await import("../controllers/admin.controller.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = ({ actorId = 2, targetId = "12", isActive = false } = {}) => ({
  user: { id: actorId },
  params: { id: targetId },
  body: { isActive },
});

describe("Admin user activation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([false, true])("sets user active=%s without changing approval status", async (isActive) => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([[
        { id: 12, role: "employer", is_active: isActive ? 0 : 1 },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = mockResponse();

    await updateUserActivation(request({ isActive }), res);

    const [sql, params] = dbMock.query.mock.calls[2];
    expect(sql).toContain("target.is_active = ?");
    expect(sql).toContain("target.deactivated_at");
    expect(sql).not.toContain("target.status");
    expect(params).toEqual([2, isActive ? 1 : 0, isActive ? 1 : 0, "12", isActive ? 1 : 0]);
    expect(res.json).toHaveBeenCalledWith({
      message: isActive ? "User reactivated successfully" : "User deactivated successfully",
    });
  });

  test("uses the actor's current database role instead of the JWT role", async () => {
    dbMock.query.mockResolvedValueOnce([[{ role: "student", is_active: 1 }]]);
    const res = mockResponse();

    await updateUserActivation(request(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("blocks an admin from deactivating their own account", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([[{ id: 2, role: "admin", is_active: 1 }]]);
    const res = mockResponse();

    await updateUserActivation(request({ actorId: 2, targetId: "2" }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You cannot deactivate your own account",
    });
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("does not deactivate the last active admin", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([[{ id: 3, role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = mockResponse();

    await updateUserActivation(request({ targetId: "3" }), res);

    expect(dbMock.query.mock.calls[2][0]).toContain("COUNT(*) AS active_admins");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "The last active admin account cannot be deactivated",
    });
  });

  test.each([false, true])("treats a repeated active=%s request as a successful no-op", async (isActive) => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([[
        { id: 12, role: "student", is_active: isActive ? 1 : 0 },
      ]]);
    const res = mockResponse();

    await updateUserActivation(request({ isActive }), res);

    expect(res.json).toHaveBeenCalledWith({
      message: isActive ? "User is already active" : "User is already inactive",
    });
    expect(dbMock.query).toHaveBeenCalledTimes(2);
  });

  test("returns 404 when the target user does not exist", async () => {
    dbMock.query
      .mockResolvedValueOnce([[{ role: "admin", is_active: 1 }]])
      .mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await updateUserActivation(request({ targetId: "404" }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("rejects a non-boolean activation value", async () => {
    const req = request();
    req.body.isActive = 0;
    const res = mockResponse();

    await updateUserActivation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.query).not.toHaveBeenCalled();
  });
});
