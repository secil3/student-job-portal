import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/JobCard.css";

const JobCard = ({ job }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const applied = Boolean(job.applied);

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
              applied ? "applied" : ""
            }`}
            onClick={() => navigate("/student/jobs")}
            disabled={applied}
          >
            {applied ? "Applied" : "Apply"}
          </button>
        )}
      </div>
    </article>
  );
};

export default JobCard;
