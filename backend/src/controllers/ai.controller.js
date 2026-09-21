import db from "../config/db.js";
import {
  AI_PROVIDER_NOT_CONFIGURED,
  generateApplicationMessage,
} from "../services/applicationMessage.service.js";
import { generateInterviewPreparation } from "../services/interviewPreparation.service.js";
import { consumeApplicationMessageRequest } from "../services/applicationMessageRateLimit.service.js";

const MAX_NOTES_LENGTH = 1000;
const MAX_MESSAGE_LENGTH = 4000;
const SUPPORTED_LANGUAGES = new Set(["tr", "en"]);
const MAX_INTERVIEW_QUESTION_LENGTH = 500;
const MAX_INTERVIEW_TIP_LENGTH = 800;

const normalizeRequest = (body) => {
  const rawJobId = body?.jobId;
  const jobId = typeof rawJobId === "string" && /^\d+$/.test(rawJobId)
    ? Number(rawJobId)
    : rawJobId;

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return { error: "A valid jobId is required" };
  }

  const rawNotes = body?.notes;
  if (rawNotes !== undefined && rawNotes !== null && typeof rawNotes !== "string") {
    return { error: "Notes must be text" };
  }

  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) {
    return { error: `Notes must be at most ${MAX_NOTES_LENGTH} characters` };
  }

  const rawLanguage = body?.language ?? "tr";
  if (typeof rawLanguage !== "string" || !SUPPORTED_LANGUAGES.has(rawLanguage)) {
    return { error: "Language must be tr or en" };
  }

  return { values: { jobId, notes, language: rawLanguage } };
};

export const createApplicationMessage = async (req, res) => {
  const studentId = req.user?.id;

  if (!studentId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const normalized = normalizeRequest(req.body);
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  try {
    const [users] = await db.query(
      "SELECT role, is_verified, is_active FROM users WHERE id = ?",
      [studentId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (users[0].role !== "student") {
      return res.status(403).json({ message: "Only students can use AI Assistant" });
    }

    if (Number(users[0].is_active) !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (Number(users[0].is_verified) !== 1) {
      return res.status(403).json({
        message: "Verify your ADU student email before using AI Assistant",
      });
    }

    if (!consumeApplicationMessageRequest(studentId)) {
      return res.status(429).json({
        message: "Too many AI message requests. Please try again later.",
      });
    }

    const { jobId, notes, language } = normalized.values;
    const [jobs] = await db.query(
      `SELECT id, title, description, location, salary
       FROM jobs
       WHERE id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    let message;
    try {
      message = await generateApplicationMessage({
        job: jobs[0],
        notes,
        language,
      });
    } catch (error) {
      if (error?.code === AI_PROVIDER_NOT_CONFIGURED) {
        return res.status(503).json({
          message: "AI message generation is not configured",
        });
      }

      return res.status(503).json({
        message: "AI service is temporarily unavailable",
      });
    }

    if (
      typeof message !== "string"
      || message.trim().length === 0
      || message.trim().length > MAX_MESSAGE_LENGTH
    ) {
      return res.status(502).json({
        message: "AI service returned an invalid response",
      });
    }

    return res.json({ message: message.trim() });
  } catch (error) {
    console.error("createApplicationMessage error:", error.code || error.name);
    return res.status(500).json({ message: "AI message could not be generated" });
  }
};

const normalizeInterviewRequest = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid jobId is required" };
  }

  const unexpectedFields = Object.keys(body)
    .filter((field) => !["jobId", "language"].includes(field));
  if (unexpectedFields.length > 0) {
    return { error: "Only jobId and language are allowed" };
  }

  const rawJobId = body.jobId;
  const jobId = typeof rawJobId === "string" && /^\d+$/.test(rawJobId)
    ? Number(rawJobId)
    : rawJobId;
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return { error: "A valid jobId is required" };
  }

  const language = body.language ?? "tr";
  if (typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
    return { error: "Language must be tr or en" };
  }

  return { values: { jobId, language } };
};

const hasValidInterviewQuestions = (questions) => Array.isArray(questions)
  && questions.length === 3
  && questions.every((item) => (
    item
    && typeof item === "object"
    && !Array.isArray(item)
    && Object.keys(item).length === 2
    && Object.hasOwn(item, "question")
    && Object.hasOwn(item, "tip")
    && typeof item.question === "string"
    && item.question.trim().length > 0
    && item.question.trim().length <= MAX_INTERVIEW_QUESTION_LENGTH
    && typeof item.tip === "string"
    && item.tip.trim().length > 0
    && item.tip.trim().length <= MAX_INTERVIEW_TIP_LENGTH
  ));

export const createInterviewPreparation = async (req, res) => {
  const studentId = req.user?.id;
  if (!studentId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const normalized = normalizeInterviewRequest(req.body);
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  try {
    const [users] = await db.query(
      "SELECT role, is_verified, is_active FROM users WHERE id = ?",
      [studentId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }
    if (users[0].role !== "student") {
      return res.status(403).json({ message: "Only students can use interview preparation" });
    }
    if (Number(users[0].is_active) !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }
    if (Number(users[0].is_verified) !== 1) {
      return res.status(403).json({
        message: "Verify your ADU student email before using interview preparation",
      });
    }

    if (!consumeApplicationMessageRequest(studentId)) {
      return res.status(429).json({
        message: "Too many AI requests. Please try again later.",
      });
    }

    const { jobId, language } = normalized.values;
    const [jobs] = await db.query(
      `SELECT id, title, description, location
       FROM jobs
       WHERE id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    let preparation;
    try {
      preparation = await generateInterviewPreparation({
        job: jobs[0],
        language,
      });
    } catch (error) {
      if (error?.code === AI_PROVIDER_NOT_CONFIGURED) {
        return res.status(503).json({
          message: "AI interview preparation is not configured",
        });
      }
      return res.status(503).json({
        message: "AI service is temporarily unavailable",
      });
    }

    if (!hasValidInterviewQuestions(preparation?.questions)) {
      return res.status(502).json({
        message: "AI service returned invalid interview preparation",
      });
    }

    return res.json({
      questions: preparation.questions.map((item) => ({
        question: item.question.trim(),
        tip: item.tip.trim(),
      })),
    });
  } catch (error) {
    console.error("createInterviewPreparation error:", error.code || error.name);
    return res.status(500).json({
      message: "Interview preparation could not be generated",
    });
  }
};
