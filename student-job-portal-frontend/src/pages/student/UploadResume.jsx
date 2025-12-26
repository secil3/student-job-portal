import { useState } from "react";
import api from "../../services/api";

export default function UploadResume({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a resume file ❗");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await api.post("/resumes/upload", formData);
      alert("Resume uploaded successfully ✅");

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err.response?.data || err.message);
      alert(
        err.response?.data?.message ||
        "Resume upload failed ❌ (see console)"
      );
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button type="button" onClick={handleUpload}>
        Upload Resume
      </button>
    </div>
  );
}
