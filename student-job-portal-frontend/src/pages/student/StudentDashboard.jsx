import { useEffect, useState } from "react";
import { getAllJobs } from "../../api/job.api";
import { getStudentApplications } from "../../api/application.api";
import JobCard from "../../components/JobCard";
import { Link } from "react-router-dom";

import "../../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Job list
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getAllJobs();
        setJobs(res.data);
      } catch {
        setError("Failed to load jobs");
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // 🔹 My Applications
  const fetchApplications = async () => {
    try {
      const res = await getStudentApplications();
      setApplications(res.data);
    } catch (err) {
      console.error("APPLICATIONS ERROR:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loadingJobs || loadingApps) {
    return (
      <div className="student-page">
        <div className="student-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-page">
        <div className="student-container">
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="student-container">
        <header className="student-dashboard-header">
          <span>Student workspace</span>
          <h1>Student Dashboard</h1>
          <p>Track your applications and discover available opportunities.</p>
        </header>

        <div className="student-summary-grid">
          <div className="student-summary-card">
            <h4>Total Applications</h4>
            <p>{applications.length}</p>
          </div>

          <div className="student-summary-card">
            <h4>Available Jobs</h4>
            <p>{jobs.length}</p>
          </div>
        </div>

        <section className="student-dashboard-section">
          <div className="student-section-heading">
            <div>
              <span>Progress</span>
              <h2>My Applications</h2>
            </div>
          </div>

          {applications.length === 0 ? (
            <p className="student-empty-state">You haven’t applied to any jobs yet.</p>
          ) : (
            <div className="student-applications-grid">
              {applications.map((app) => (
                <article key={app.application_id} className="student-application-card">
                  <div className="student-application-main">
                    <span>Job</span>
                    <h3>{app.job_title}</h3>
                  </div>

                  <div className="student-application-meta">
                    <span className={`student-status-badge status-${app.status}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    <time dateTime={app.applied_at}>
                      {new Date(app.applied_at).toLocaleDateString()}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="student-dashboard-section">
          <div className="student-section-heading student-jobs-heading">
            <div>
              <span>Explore</span>
              <h2>Available Jobs</h2>
            </div>

            <Link to="/student/jobs" className="browse-jobs-link">
              Browse Jobs
            </Link>
          </div>

          {jobs.length === 0 ? (
            <p className="student-empty-state">No jobs available.</p>
          ) : (
            <div className="student-dashboard-jobs-grid">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
