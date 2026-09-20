import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/JobCard.css";

const JobCard = ({ job, applicationState }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const applied = applicationState === "applied";
  const applicationStateUnknown = applicationState === "unknown";

  return (
    <article className="student-job-preview-card">
      <div className="student-job-preview-header">
        <div>
          <h3>{job.title}</h3>
          {job.companyName && <div className="student-job-company">{job.companyName}</div>}
        </div>
      </div>

      <div className="student-job-badges">
        {job.location && (
          <span>{job.location}</span>
        )}
        {job.jobType && (
          <span>{job.jobType}</span>
        )}
      </div>

      <p className="student-job-preview-description">
        {job.description}
      </p>

      <div className="student-job-preview-footer">
        <div className="student-job-salary">
          {job.salary || "Salary not specified"}
        </div>

        {role === "student" && (
          <button
            className={`student-preview-apply-btn ${
              applied ? "applied" : applicationStateUnknown ? "unavailable" : ""
            }`}
            onClick={() => navigate("/student/jobs")}
            disabled={applied || applicationStateUnknown}
          >
            {applied ? "Already Applied" : applicationStateUnknown ? "Unavailable" : "Apply"}
          </button>
        )}
      </div>
    </article>
  );
};

export default JobCard;
