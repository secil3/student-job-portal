import { useState } from "react";
import api from "../../services/api";
import "../../styles/UploadResume.css";

export default function UploadResume({ onUploadSuccess, className = "" }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async () => {
    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a resume file ❗");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await api.post("/resumes/upload", formData);
      setMessage("Resume uploaded successfully ✅");

      if (typeof onUploadSuccess === "function") {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Resume upload failed ❌");
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-title">Upload Resume</div>

      <input
        className="upload-input"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />

<button
  type="button"
  className={`btn btn-primary upload-btn ${className}`.trim()}
  onClick={handleUpload}
>
  Upload Resume
</button>


      {message && <div className="upload-success">{message}</div>}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
