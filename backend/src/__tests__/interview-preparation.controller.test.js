import { jest } from "@jest/globals";

const dbMock = { query: jest.fn() };
const generateInterviewPreparationMock = jest.fn();
const consumeApplicationMessageRequestMock = jest.fn();

await jest.unstable_mockModule("../config/db.js", () => ({
  default: dbMock,
}));

await jest.unstable_mockModule("../services/applicationMessage.service.js", () => ({
  AI_PROVIDER_NOT_CONFIGURED: "AI_PROVIDER_NOT_CONFIGURED",
  generateApplicationMessage: jest.fn(),
}));

await jest.unstable_mockModule("../services/interviewPreparation.service.js", () => ({
  generateInterviewPreparation: generateInterviewPreparationMock,
}));

await jest.unstable_mockModule(
  "../services/applicationMessageRateLimit.service.js",
  () => ({
    consumeApplicationMessageRequest: consumeApplicationMessageRequestMock,
  })
);

const { createInterviewPreparation } = await import("../controllers/ai.controller.js");

const questions = [
  { question: "Question one?", tip: "Tip one" },
  { question: "Question two?", tip: "Tip two" },
  { question: "Question three?", tip: "Tip three" },
];

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const request = (body = {}) => ({
  user: { id: 7, role: "student" },
  body,
});

const mockVerifiedStudent = () => {
  dbMock.query.mockResolvedValueOnce([[
    { role: "student", is_verified: 1, is_active: 1 },
  ]]);
};

const mockJob = () => {
  dbMock.query.mockResolvedValueOnce([[
    {
      id: 4,
      title: "Synthetic Internship",
      description: "Synthetic description",
      location: "Aydin",
    },
  ]]);
};

describe("AI interview preparation controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumeApplicationMessageRequestMock.mockReturnValue(true);
  });

  test("returns exactly three questions using the database job", async () => {
    mockVerifiedStudent();
    mockJob();
    generateInterviewPreparationMock.mockResolvedValueOnce({ questions });
    const res = mockResponse();

    await createInterviewPreparation(
      request({ jobId: 4, language: "en" }),
      res
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("FROM jobs"),
      [4]
    );
    expect(dbMock.query.mock.calls[1][0]).not.toContain("salary");
    expect(generateInterviewPreparationMock).toHaveBeenCalledWith({
      job: {
        id: 4,
        title: "Synthetic Internship",
        description: "Synthetic description",
        location: "Aydin",
      },
      language: "en",
    });
    expect(res.json).toHaveBeenCalledWith({ questions });
  });

  test.each([
    [{}, "A valid jobId is required"],
    [{ jobId: 0 }, "A valid jobId is required"],
    [{ jobId: "invalid" }, "A valid jobId is required"],
    [{ jobId: 4, language: "de" }, "Language must be tr or en"],
    [{ jobId: 4, description: "client data" }, "Only jobId and language are allowed"],
  ])("rejects invalid input", async (body, expectedMessage) => {
    const res = mockResponse();

    await createInterviewPreparation(request(body), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    expect(dbMock.query).not.toHaveBeenCalled();
  });

  test("blocks a user whose current database role is not student", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "employer", is_verified: 1, is_active: 1 },
    ]]);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("blocks an unverified student", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "student", is_verified: 0, is_active: 1 },
    ]]);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
  });

  test("blocks an inactive student before using the AI provider", async () => {
    dbMock.query.mockResolvedValueOnce([[
      { role: "student", is_verified: 1, is_active: 0 },
    ]]);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Account is inactive" });
    expect(dbMock.query).toHaveBeenCalledTimes(1);
    expect(generateInterviewPreparationMock).not.toHaveBeenCalled();
  });

  test("uses the shared AI request limit before loading the job", async () => {
    mockVerifiedStudent();
    consumeApplicationMessageRequestMock.mockReturnValueOnce(false);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(consumeApplicationMessageRequestMock).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(dbMock.query).toHaveBeenCalledTimes(1);
    expect(generateInterviewPreparationMock).not.toHaveBeenCalled();
  });

  test("returns 404 when the database job does not exist", async () => {
    mockVerifiedStudent();
    dbMock.query.mockResolvedValueOnce([[]]);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 404 }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(generateInterviewPreparationMock).not.toHaveBeenCalled();
  });

  test.each([
    { questions: questions.slice(0, 2) },
    { questions: [...questions, { question: "Fourth?", tip: "Fourth tip" }] },
    { questions: [{ question: "Question?", tip: "" }, ...questions.slice(1)] },
  ])("rejects an invalid service result", async (serviceResult) => {
    mockVerifiedStudent();
    mockJob();
    generateInterviewPreparationMock.mockResolvedValueOnce(serviceResult);
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  test("returns a safe 503 when the provider fails", async () => {
    mockVerifiedStudent();
    mockJob();
    generateInterviewPreparationMock.mockRejectedValueOnce(
      Object.assign(new Error("provider details"), { code: "AI_PROVIDER_TIMEOUT" })
    );
    const res = mockResponse();

    await createInterviewPreparation(request({ jobId: 4 }), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      message: "AI service is temporarily unavailable",
    });
  });

  test("returns marked deterministic questions in demo mock mode without calling the provider", async () => {
    const previousDemoMode = process.env.DEMO_MODE;
    const previousDemoAiMode = process.env.DEMO_AI_MODE;
    process.env.DEMO_MODE = "true";
    process.env.DEMO_AI_MODE = "mock";

    try {
      mockVerifiedStudent();
      mockJob();
      const res = mockResponse();

      await createInterviewPreparation(request({ jobId: 4 }), res);

      expect(generateInterviewPreparationMock).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        questions: expect.arrayContaining([
          expect.objectContaining({
            question: expect.any(String),
            tip: expect.any(String),
          }),
        ]),
        isDemoAi: true,
      });
      expect(res.json.mock.calls[0][0].questions).toHaveLength(3);
    } finally {
      if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
      else process.env.DEMO_MODE = previousDemoMode;
      if (previousDemoAiMode === undefined) delete process.env.DEMO_AI_MODE;
      else process.env.DEMO_AI_MODE = previousDemoAiMode;
    }
  });
});
