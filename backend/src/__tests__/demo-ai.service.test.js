import { jest } from "@jest/globals";
import {
  executeDemoAiRequest,
  getDemoAiMode,
  runApplicationMessageProvider,
  runInterviewPreparationProvider,
} from "../services/demoAi.service.js";

const originalDemoMode = process.env.DEMO_MODE;
const originalDemoAiMode = process.env.DEMO_AI_MODE;

describe("demo AI provider modes", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    process.env.DEMO_AI_MODE = "fallback";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;

    if (originalDemoAiMode === undefined) delete process.env.DEMO_AI_MODE;
    else process.env.DEMO_AI_MODE = originalDemoAiMode;
  });

  test("live mode returns a successful provider response", async () => {
    process.env.DEMO_AI_MODE = "live";
    const provider = jest.fn().mockResolvedValue("Live response");

    await expect(executeDemoAiRequest({ provider, fallback: () => "Fallback" }))
      .resolves.toEqual({ value: "Live response", isDemoAi: false });
  });

  test("live mode preserves the normal provider error", async () => {
    process.env.DEMO_AI_MODE = "live";
    const error = Object.assign(new Error("provider unavailable"), {
      code: "AI_PROVIDER_REQUEST_FAILED",
    });

    await expect(executeDemoAiRequest({
      provider: jest.fn().mockRejectedValue(error),
      fallback: () => "Fallback",
    })).rejects.toBe(error);
  });

  test("fallback mode keeps a successful live provider response", async () => {
    const provider = jest.fn().mockResolvedValue("Live response");

    await expect(executeDemoAiRequest({ provider, fallback: () => "Fallback" }))
      .resolves.toEqual({ value: "Live response", isDemoAi: false });
  });

  test("fallback mode returns deterministic demo content after provider failure", async () => {
    const provider = jest.fn().mockRejectedValue(
      Object.assign(new Error("timeout"), { code: "AI_PROVIDER_TIMEOUT" })
    );

    const result = await runApplicationMessageProvider(provider);

    expect(result.isDemoAi).toBe(true);
    expect(result.value).toContain("yayınladığınız pozisyonla ilgileniyorum");
  });

  test("mock mode never calls the provider", async () => {
    process.env.DEMO_AI_MODE = "mock";
    const provider = jest.fn();

    const result = await runInterviewPreparationProvider(provider);

    expect(provider).not.toHaveBeenCalled();
    expect(result.isDemoAi).toBe(true);
    expect(result.value.questions).toHaveLength(3);
    expect(result.value.questions.every(({ question, tip }) => question && tip)).toBe(true);
  });

  test("invalid or missing demo mode safely defaults to fallback", () => {
    process.env.DEMO_AI_MODE = "unexpected";
    expect(getDemoAiMode()).toBe("fallback");
    delete process.env.DEMO_AI_MODE;
    expect(getDemoAiMode()).toBe("fallback");
  });

  test("non-demo environments always preserve live provider behavior", () => {
    process.env.DEMO_MODE = "false";
    process.env.DEMO_AI_MODE = "mock";
    expect(getDemoAiMode()).toBe("live");
  });
});
