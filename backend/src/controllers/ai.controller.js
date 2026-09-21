import db from "../config/db.js";
import {
  AI_PROVIDER_NOT_CONFIGURED,
  generateApplicationMessage,
} from "../services/applicationMessage.service.js";
import { consumeApplicationMessageRequest } from "../services/applicationMessageRateLimit.service.js";

const MAX_NOTES_LENGTH = 1000;
const MAX_MESSAGE_LENGTH = 4000;
const SUPPORTED_LANGUAGES = new Set(["tr", "en"]);

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
      "SELECT role, is_verified FROM users WHERE id = ?",
      [studentId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (users[0].role !== "student") {
      return res.status(403).json({ message: "Only students can use AI Assistant" });
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
