import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/JobCard.css";

const JobCard = ({ job }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const applied = Boolean(job.applied);

  return (
    <div className="job-card">
      {/* HEADER */}
      <div className="job-header">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="job-company">{job.companyName}</div>
        </div>
      </div>

      {/* BADGES */}
      <div className="job-badges">
        {job.location && (
          <span className="job-badge">{job.location}</span>
        )}
        {job.jobType && (
          <span className="job-badge">{job.jobType}</span>
        )}
      </div>

      {/* DESCRIPTION */}
      <div className="job-description">
        {job.description}
      </div>

      {/* FOOTER */}
      <div className="job-footer">
        <div className="job-salary">
          {job.salary ? `${job.salary} ₺` : "Salary not specified"}
        </div>

        {role === "student" && (
          <button
            className={`btn btn-primary apply-btn ${
              applied ? "applied" : ""
            }`}
            onClick={() => navigate("/student/jobs")}
            disabled={applied}
          >
            {applied ? "Applied" : "Select CV & Apply"}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
