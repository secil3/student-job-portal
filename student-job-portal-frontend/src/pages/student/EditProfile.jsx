import { useEffect, useState } from "react";
import api from "../../services/api";
import UploadResume from "./UploadResume";

export default function EditProfile() {
  const [form, setForm] = useState({
    university: "",
    major: "",
    GPA: ""
  });

  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Profil bilgilerini backend'den çek
  const fetchProfile = async () => {
    try {
      const res = await api.get("/student/profile");
      setForm(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Input değişimleri
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Save Profile
  const handleSubmit = async () => {
    // Resume zorunlu
    if (!resumeUploaded) {
      setError("You must upload a resume before saving your profile.");
      setSuccess("");
      return;
    }

    try {
      await api.put("/student/profile", form);

      // UI geri bildirimi
      setSavedProfile(form);
      setSuccess("Profile updated successfully ✅");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile ❌");
      setSuccess("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>Edit Profile</h2>

      {/* PROFILE FORM */}
      <div>
        <label>University</label><br />
        <input
          name="university"
          value={form.university}
          onChange={handleChange}
        />

        <br /><br />

        <label>Major</label><br />
        <input
          name="major"
          value={form.major}
          onChange={handleChange}
        />

        <br /><br />

        <label>GPA</label><br />
        <input
          name="GPA"
          value={form.GPA}
          onChange={handleChange}
        />
      </div>

      <hr />

      {/* RESUME UPLOAD */}
      <h3>Resume (Required)</h3>
      <UploadResume onUploadSuccess={() => setResumeUploaded(true)} />

      {/* ERROR / SUCCESS MESSAGES */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <br />

      {/* SAVE BUTTON – EN ALTTA */}
      <button onClick={handleSubmit}>
        Save Profile
      </button>

      <hr />

      {/* PROFILE SUMMARY */}
      {savedProfile && (
  <div style={{ marginTop: "20px" }}>
    <h3>Profile Summary</h3>
    <p><b>University:</b> {savedProfile.university}</p>
    <p><b>Major:</b> {savedProfile.major}</p>
    <p><b>GPA:</b> {savedProfile.GPA}</p>

    <p>
      <b>Resume:</b>{" "}
      <a
        href={`http://localhost:5050/${savedProfile.resume_path}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Resume (PDF)
      </a>
    </p>
    </div>
    )}
    </div>
  );
}
