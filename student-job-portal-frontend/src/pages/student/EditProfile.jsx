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
      <div className="profile-card">
        <h2>Edit Profile</h2>

        <input
          className="profile-input"
          name="university"
          placeholder="University"
          value={form.university || ""}
          onChange={handleChange}
          maxLength={255}
        />

        <input
          className="profile-input"
          name="major"
          placeholder="Major"
          value={form.major || ""}
          onChange={handleChange}
          maxLength={255}
        />

        <input
          className="profile-input"
          type="number"
          name="GPA"
          placeholder="GPA (0.00–4.00)"
          value={form.GPA || ""}
          onChange={handleChange}
          min="0"
          max="4"
          step="0.01"
        />

        {/* Resume summary card */}
        <div className="resume-summary">
          <div>
            <h3>Resume</h3>
            <p className={hasResume ? "resume-ok" : "resume-warn"}>
              {hasResume ? "✅ Resume uploaded" : "⚠️ No resume uploaded yet"}
            </p>
            {resumeError && <p className="auth-error">{resumeError}</p>}
          </div>

          <Link to="/student/resumes" className="btn btn-secondary">
            Manage My Resumes
          </Link>
        </div>

        {profileError && <p className="auth-error">{profileError}</p>}
        {saveError && <p className="auth-error">{saveError}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button className="btn btn-primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
