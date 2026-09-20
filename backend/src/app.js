import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/jobs.routes.js";
import resumeRoutes from "./routes/resume.routes.js";

import applicationRoutes from "./routes/application.routes.js";
import testRoutes from "./routes/test.routes.js";

import auth from "./middleware/auth.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Student Job Portal API is running 🚀");
});

// ✅ PUBLIC
app.use("/api/auth", authRoutes);

// ✅ PROTECTED
app.use("/api/jobs", jobRoutes);
// app.use("/api/resume", auth, resumeRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/applications", auth, applicationRoutes);
app.use("/api/student", studentRoutes);

app.use("/api/admin", adminRoutes);
// optional
app.use("/api/test", testRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
