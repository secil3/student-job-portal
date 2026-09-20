import { useState } from "react";
import api from "../../services/api";
import "../../styles/JobForm.css";

export default function JobPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/jobs", {
        title,
        description,
        location,
        salary,
      });

      setMessage("Job posted successfully ✅");
      setTitle("");
      setDescription("");
      setLocation("");
      setSalary("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post job ❌");
    }
  };

  return (
    <div className="jobform-container jobpost-page">
      <div className="jobform-card">
        <h2 className="jobform-title">Post a New Job</h2>
        <p className="jobform-intro">Share the role details with prospective students.</p>

        <form className="jobform" onSubmit={handleSubmit}>
          <label className="jobform-field">
            <span>Job title</span>
            <input
              className="jobform-input"
              placeholder="e.g. Junior Product Designer"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="jobform-field">
            <span>Description</span>
            <textarea
              className="jobform-textarea"
              placeholder="Describe the role and key responsibilities"
              value={description}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="jobform-row">
            <label className="jobform-field">
              <span>Location</span>
              <input
                className="jobform-input"
                placeholder="e.g. Remote"
                value={location}
                required
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>

            <label className="jobform-field">
              <span>Salary</span>
              <input
                className="jobform-input"
                placeholder="Optional"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </label>
          </div>

          <div className="jobform-actions">
            <button className="btn btn-primary" type="submit">
              Post Job
            </button>
          </div>
        </form>

        {message && <p className="jobform-success">{message}</p>}
        {error && <p className="jobform-error">{error}</p>}
      </div>
    </div>
  );
}
