import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applyToJob, getStudentApplications } from "../../api/application.api";
import api from "../../services/api";
import {
  getAppliedJobIds,
  getJobApplicationState,
} from "../../utils/applicationStatus";
import "../../styles/JobList.css";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationsLoaded, setApplicationsLoaded] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [jobsResult, resumesResult, applicationsResult] = await Promise.allSettled([
          api.get("/jobs"),
          api.get("/resumes"),
          getStudentApplications(),
        ]);

        if (jobsResult.status === "rejected" || resumesResult.status === "rejected") {
          const requestError = jobsResult.status === "rejected"
            ? jobsResult.reason
            : resumesResult.reason;
          setError(requestError.response?.data?.message || "Failed to load jobs");
        } else {
          setJobs(jobsResult.value.data);
          setResumes(resumesResult.value.data);
        }

        if (applicationsResult.status === "fulfilled") {
          setAppliedJobIds(getAppliedJobIds(applicationsResult.value.data));
          setApplicationsLoaded(true);
        } else {
          setApplicationsError(
            applicationsResult.reason.response?.data?.message ||
              "Application history could not be loaded. Applying is disabled."
          );
        }
      } catch {
        setError("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  const handleApply = async (jobId) => {
    const applicationState = getJobApplicationState(
      jobId,
      appliedJobIds,
      applicationsLoaded
    );

    if (applicationState !== "available") return;

    if (!selectedResume) {
      alert("Please select a resume ❗");
      return;
    }

    try {
      await applyToJob(jobId, selectedResume);
      setAppliedJobIds((current) => new Set(current).add(Number(jobId)));
      alert("Applied successfully ✅");
    } catch (err) {
      alert(err?.response?.data?.message || "Apply failed ❌");
    }
  };

  return (
    <div className="student-jobs-page">
      <header className="student-jobs-header">
        <span>Opportunities</span>
        <h1>Available Jobs</h1>
        <p>Select one of your uploaded CVs, then apply to a role that fits.</p>
      </header>

      <div className="resume-select">
        <label htmlFor="job-resume-select">CV for your application</label>
        <div className="resume-select-control">
          <select
            id="job-resume-select"
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
          >
            <option value="">Select a CV</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="student-jobs-message">Loading jobs...</p>}
      {!loading && error && <p className="student-jobs-message student-jobs-error">{error}</p>}
      {!loading && !error && applicationsError && (
        <p className="student-jobs-message student-jobs-error">{applicationsError}</p>
      )}
      {!loading && !error && jobs.length === 0 && (
        <p className="student-jobs-message">No jobs are available right now.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="student-jobs-grid">
          {jobs.map((job) => (
            <article key={job.id} className="student-job-card">
              <div className="student-job-card-content">
                <h2>{job.title}</h2>

                <div className="student-job-meta">
                  {job.location && <span>{job.location}</span>}
                  {job.salary && <span>{job.salary}</span>}
                </div>

                <p>{job.description}</p>
              </div>

              <div className="student-job-card-actions">
                <Link
                  to={`/student/jobs/${job.id}/assistant`}
                  className="student-ai-assistant-link"
                >
                  AI Assistant
                </Link>
                <Link
                  to={`/student/jobs/${job.id}/interview-prep`}
                  className="student-interview-prep-link"
                >
                  Mülakata hazırlan
                </Link>
                {(() => {
                  const applicationState = getJobApplicationState(
                    job.id,
                    appliedJobIds,
                    applicationsLoaded
                  );
                  const disabled = applicationState !== "available";

                  return (
                    <button
                      type="button"
                      onClick={() => handleApply(job.id)}
                      className={`student-apply-btn ${
                        applicationState === "applied" ? "applied" : ""
                      }`}
                      disabled={disabled}
                    >
                      {applicationState === "applied"
                        ? "Already Applied"
                        : applicationState === "unknown"
                          ? "Apply unavailable"
                          : "Apply"}
                    </button>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
