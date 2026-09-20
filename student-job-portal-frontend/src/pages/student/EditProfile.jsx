import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/EditProfile.css";

export default function EditProfile() {
  const [form, setForm] = useState({
    university: "",
    major: "",
    GPA: "",
  });

  const [hasResume, setHasResume] = useState(false);
  const [success, setSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await api.get("/student/profile");
        setForm({
          university: profileRes.data?.university ?? "",
          major: profileRes.data?.major ?? "",
          GPA: profileRes.data?.GPA ?? "",
        });
      } catch (e) {
        setProfileError(e.response?.data?.message || "Failed to load profile ❌");
      }
    };

    const loadResumeSummary = async () => {
      try {
        const resumesRes = await api.get("/resumes");
        setHasResume((resumesRes.data || []).length > 0);
      } catch (e) {
        setResumeError(e.response?.data?.message || "Failed to load resume summary ❌");
      }
    };

    loadProfile();
    loadResumeSummary();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (isSaving) return;

    setSuccess("");
    setSaveError("");

    const gpa = String(form.GPA ?? "").trim();
    const validGPA = gpa === "" || /^(?:[0-3](?:\.\d{1,2})?|4(?:\.0{1,2})?)$/.test(gpa);
    if (!validGPA) {
      setSaveError("GPA must be between 0.00 and 4.00 and use at most two decimal places.");
      return;
    }

    setIsSaving(true);
    try {
      await api.put("/student/profile", form);
      setSuccess("Profile updated successfully ✅");
    } catch (e) {
      setSaveError(e.response?.data?.message || "Failed to save profile ❌");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <span>Student profile</span>
        <h1>Edit Profile</h1>
        <p>Keep your academic information current for your applications.</p>
      </header>

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-fields">
            <label className="profile-field">
              <span>University</span>
              <input
                className="profile-input"
                name="university"
                placeholder="Enter your university"
                value={form.university || ""}
                onChange={handleChange}
                maxLength={255}
              />
            </label>

            <label className="profile-field">
              <span>Major</span>
              <input
                className="profile-input"
                name="major"
                placeholder="Enter your major"
                value={form.major || ""}
                onChange={handleChange}
                maxLength={255}
              />
            </label>

            <label className="profile-field">
              <span>GPA</span>
              <input
                className="profile-input"
                type="number"
                name="GPA"
                placeholder="0.00–4.00"
                value={form.GPA || ""}
                onChange={handleChange}
                min="0"
                max="4"
                step="0.01"
              />
              <small>Use a value between 0.00 and 4.00, with up to two decimal places.</small>
            </label>
          </div>

          {profileError && <p className="auth-error">{profileError}</p>}
          {saveError && <p className="auth-error">{saveError}</p>}
          {success && <p className="auth-success">{success}</p>}

          <div className="profile-actions">
            <button className="profile-save-btn" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        <aside className="resume-summary">
          <div className="resume-summary-icon" aria-hidden="true">PDF</div>
          <div className="resume-summary-content">
            <span>CV status</span>
            <h2>Resume</h2>
            <p className={hasResume ? "resume-ok" : "resume-warn"}>
              {hasResume ? "Resume uploaded" : "No resume uploaded yet"}
            </p>
            {resumeError && <p className="auth-error">{resumeError}</p>}
          </div>

          <Link to="/student/resumes" className="manage-resumes-link">
            Manage My Resumes
          </Link>
        </aside>
      </div>
    </div>
  );
}
