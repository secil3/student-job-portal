import { useEffect, useMemo, useState } from "react";
import { getStudentApplications } from "../../api/application.api";
import {
  APPLICATION_FILTERS,
  filterApplicationsByStatus,
} from "../../utils/applicationFilters";
import "../../styles/StudentApplications.css";

const formatStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

const formatApplicationDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
};

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadApplications = async () => {
      try {
        const response = await getStudentApplications();
        if (isActive) setApplications(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (isActive) {
          setError(
            requestError.response?.data?.message ||
              "Your applications could not be loaded. Please try again."
          );
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadApplications();
    return () => {
      isActive = false;
    };
  }, []);

  const filteredApplications = useMemo(
    () => filterApplicationsByStatus(applications, activeFilter),
    [applications, activeFilter]
  );

  return (
    <div className="student-applications-page">
      <div className="student-applications-container">
        <header className="student-applications-header">
          <span>Application history</span>
          <h1>My Applications</h1>
          <p>Review every role you have applied for and track its current status.</p>
        </header>

        {!loading && !error && applications.length > 0 && (
          <div
            className="student-application-filters"
            aria-label="Filter applications by status"
          >
            {APPLICATION_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`student-filter-button ${
                  activeFilter === filter ? "active" : ""
                }`}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {formatStatus(filter)}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="student-applications-message" role="status">
            Loading your applications...
          </p>
        )}

        {!loading && error && (
          <p className="student-applications-message error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && applications.length === 0 && (
          <p className="student-applications-message">
            You haven’t applied to any jobs yet.
          </p>
        )}

        {!loading &&
          !error &&
          applications.length > 0 &&
          filteredApplications.length === 0 && (
            <p className="student-applications-message">
              No {activeFilter} applications found.
            </p>
          )}

        {!loading && !error && filteredApplications.length > 0 && (
          <div className="student-applications-grid">
            {filteredApplications.map((application) => (
              <article
                key={application.application_id}
                className="student-application-history-card"
              >
                <div>
                  <span className="student-application-card-label">Job</span>
                  <h2>{application.job_title}</h2>
                </div>
                <div className="student-application-card-meta">
                  <time dateTime={application.applied_at}>
                    Applied {formatApplicationDate(application.applied_at)}
                  </time>
                  <span
                    className={`student-application-status status-${application.status}`}
                  >
                    {formatStatus(application.status)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
