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
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get("/student/profile");
        setForm(profileRes.data);

        // Resume var mı? (senin backend: GET /resumes)
        const resumesRes = await api.get("/resumes");
        setHasResume((resumesRes.data || []).length > 0);
      } catch (e) {
        // profil yine de açılabilsin, sadece hata göster
        setError(e.response?.data?.message || "Failed to load profile ❌");
      }
    };

    load();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setSuccess("");
    setError("");

    // ✅ resume zorunlu değil (Apply sırasında zorunlu yapmak daha doğru)
    try {
      await api.put("/student/profile", form);
      setSuccess("Profile updated successfully ✅");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save profile ❌");
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
        />

        <input
          className="profile-input"
          name="major"
          placeholder="Major"
          value={form.major || ""}
          onChange={handleChange}
        />

        <input
          className="profile-input"
          name="GPA"
          placeholder="GPA"
          value={form.GPA || ""}
          onChange={handleChange}
        />

        {/* Resume summary card */}
        <div className="resume-summary">
          <div>
            <h3>Resume</h3>
            <p className={hasResume ? "resume-ok" : "resume-warn"}>
              {hasResume ? "✅ Resume uploaded" : "⚠️ No resume uploaded yet"}
            </p>
          </div>

          <Link to="/student/resumes" className="btn btn-secondary">
            Manage My Resumes
          </Link>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button className="btn btn-primary" onClick={handleSubmit}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
