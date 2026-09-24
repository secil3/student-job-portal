import { useEffect, useState } from "react";
import { getAllJobs } from "../../api/job.api";
import { getStudentApplications } from "../../api/application.api";
import JobCard from "../../components/JobCard";
import { Link } from "react-router-dom";
import {
  getAppliedJobIds,
  getJobApplicationState,
} from "../../utils/applicationStatus";
import { getUiLabel } from "../../utils/uiLabels";
import { useAuth } from "../../context/useAuth";
import { getStudentGreeting } from "../../utils/userDisplay";

import "../../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");

  // 🔹 Job list
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getAllJobs();
        setJobs(res.data);
      } catch {
        setError("İlanlar yüklenemedi");
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
      setApplicationsError(
        err.response?.data?.message || "Başvuru geçmişi yüklenemedi"
      );
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const appliedJobIds = getAppliedJobIds(applications);
  const applicationsLoaded = !applicationsError;

  if (loadingJobs || loadingApps) {
    return (
      <div className="student-page">
        <div className="student-container">
          <p>Yükleniyor...</p>
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
          <span>Öğrenci çalışma alanı</span>
          <h1>{getStudentGreeting(user)}</h1>
          <p>Başvurularını takip et ve yeni fırsatları keşfet.</p>
        </header>

        <div className="student-summary-grid">
          <div className="student-summary-card">
            <h4>Toplam Başvuru</h4>
            <p>{applicationsLoaded ? applications.length : "—"}</p>
          </div>

          <div className="student-summary-card">
            <h4>Mevcut İlanlar</h4>
            <p>{jobs.length}</p>
          </div>
        </div>

        <section className="student-dashboard-section">
          <div className="student-section-heading">
            <div>
              <span>İlerleme</span>
              <h2>Başvurularım</h2>
            </div>
          </div>

          {applicationsError ? (
            <p className="student-application-warning">{applicationsError}</p>
          ) : applications.length === 0 ? (
            <p className="student-empty-state">Henüz hiçbir ilana başvurmadınız.</p>
          ) : (
            <div className="student-applications-grid">
              {applications.map((app) => (
                <article key={app.application_id} className="student-application-card">
                  <div className="student-application-main">
                    <span>İlan</span>
                    <h3>{app.job_title}</h3>
                  </div>

                  <div className="student-application-meta">
                    <span className={`student-status-badge status-${app.status}`}>
                      {getUiLabel(app.status)}
                    </span>
                    <time dateTime={app.applied_at}>
                      {new Date(app.applied_at).toLocaleDateString("tr-TR")}
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
              <span>Keşfet</span>
              <h2>Mevcut İlanlar</h2>
            </div>

            <Link to="/student/jobs" className="browse-jobs-link">
              İlanları İncele
            </Link>
          </div>

          {applicationsError && (
            <p className="student-application-warning">
              Başvuru geçmişine ulaşılamıyor. Yeni başvuru geçici olarak devre dışı.
            </p>
          )}

          {jobs.length === 0 ? (
            <p className="student-empty-state">Mevcut ilan bulunmuyor.</p>
          ) : (
            <div className="student-dashboard-jobs-grid">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  applicationState={getJobApplicationState(
                    job.id,
                    appliedJobIds,
                    applicationsLoaded
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
