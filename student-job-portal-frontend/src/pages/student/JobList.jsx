import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applyToJob, getStudentApplications } from "../../api/application.api";
import api from "../../services/api";
import {
  getAppliedJobIds,
  getJobApplyAvailability,
} from "../../utils/applicationStatus";
import "../../styles/JobList.css";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesLoaded, setResumesLoaded] = useState(false);
  const [resumesError, setResumesError] = useState("");
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationsLoaded, setApplicationsLoaded] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyError, setApplyError] = useState("");

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError("");
    try {
      const response = await api.get("/jobs");
      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setJobsError(
        requestError.response?.data?.message ||
          "İlanlar yüklenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadResumes = useCallback(async () => {
    setResumesLoading(true);
    setResumesLoaded(false);
    setResumesError("");
    try {
      const response = await api.get("/resumes");
      setResumes(Array.isArray(response.data) ? response.data : []);
      setResumesLoaded(true);
    } catch (requestError) {
      setResumesError(
        requestError.response?.data?.message ||
          "CV listeniz yüklenemedi. Başvuru geçici olarak devre dışı."
      );
    } finally {
      setResumesLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setApplicationsLoading(true);
    setApplicationsLoaded(false);
    setApplicationsError("");
    try {
      const response = await getStudentApplications();
      setAppliedJobIds(getAppliedJobIds(response.data));
      setApplicationsLoaded(true);
    } catch (requestError) {
      setApplicationsError(
        requestError.response?.data?.message ||
          "Başvuru geçmişi yüklenemedi. Mükerrer başvuruyu önlemek için başvuru devre dışı."
      );
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    loadResumes();
    loadApplications();
  }, [loadApplications, loadJobs, loadResumes]);

  const handleApply = async (jobId) => {
    const availability = getJobApplyAvailability({
      jobId,
      appliedJobIds,
      applicationsLoaded,
      resumesLoaded,
      resumesError,
      resumes,
      selectedResume,
    });

    if (availability.disabled) return;

    setApplyError("");
    try {
      await applyToJob(jobId, selectedResume);
      setAppliedJobIds((current) => new Set(current).add(Number(jobId)));
      alert("Başvuru başarıyla gönderildi ✅");
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        setAppliedJobIds((current) => new Set(current).add(Number(jobId)));
        setApplyError("Bu ilana daha önce başvurdunuz.");
      } else {
        setApplyError(
          requestError?.response?.data?.message ||
            "Başvurunuz gönderilemedi. Lütfen tekrar deneyin."
        );
      }
    }
  };

  return (
    <div className="student-jobs-page">
      <header className="student-jobs-header">
        <span>Fırsatlar</span>
        <h1>Mevcut İlanlar</h1>
        <p>Yüklediğiniz CV’lerden birini seçin ve size uygun ilana başvurun.</p>
      </header>

      {resumesLoading && (
        <p className="student-jobs-message">CV’leriniz yükleniyor...</p>
      )}
      {!resumesLoading && resumesError && (
        <p className="student-jobs-message student-jobs-error">
          {resumesError}
        </p>
      )}
      {!resumesLoading && resumesLoaded && resumes.length === 0 && (
        <div className="student-jobs-message student-jobs-cv-empty">
          <span>Başvuru yapmak için önce CV yükleyin.</span>
          <Link to="/student/resumes">CV’lerim sayfasına git</Link>
        </div>
      )}
      {!resumesLoading && resumesLoaded && resumes.length > 0 && (
        <div className="resume-select">
          <label htmlFor="job-resume-select">Başvurunuz için CV</label>
          <div className="resume-select-control">
            <select
              id="job-resume-select"
              value={selectedResume}
              onChange={(event) => setSelectedResume(event.target.value)}
            >
              <option value="">Bir CV seçin</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {applicationsLoading && (
        <p className="student-jobs-message">
          Başvuru geçmişiniz kontrol ediliyor...
        </p>
      )}
      {!applicationsLoading && applicationsError && (
        <p className="student-jobs-message student-jobs-error">
          {applicationsError}
        </p>
      )}
      {applyError && (
        <p className="student-jobs-message student-jobs-error">{applyError}</p>
      )}

      {jobsLoading && <p className="student-jobs-message">İlanlar yükleniyor...</p>}
      {!jobsLoading && jobsError && (
        <div className="student-jobs-message student-jobs-error student-jobs-retry">
          <span>{jobsError}</span>
          <button type="button" onClick={loadJobs}>
            Tekrar Dene
          </button>
        </div>
      )}
      {!jobsLoading && !jobsError && jobs.length === 0 && (
        <p className="student-jobs-message">Şu anda mevcut ilan bulunmuyor.</p>
      )}

      {!jobsLoading && !jobsError && jobs.length > 0 && (
        <div className="student-jobs-grid">
          {jobs.map((job) => {
            const availability = getJobApplyAvailability({
              jobId: job.id,
              appliedJobIds,
              applicationsLoaded,
              resumesLoaded,
              resumesError,
              resumes,
              selectedResume,
            });

            return (
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
                    AI Başvuru Mesajı
                  </Link>
                  <Link
                    to={`/student/jobs/${job.id}/interview-prep`}
                    className="student-interview-prep-link"
                  >
                    Mülakata hazırlan
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleApply(job.id)}
                    className={`student-apply-btn ${
                      availability.state === "applied" ? "applied" : ""
                    }`}
                    disabled={availability.disabled}
                  >
                    {availability.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
