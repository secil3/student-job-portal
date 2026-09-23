import { useState } from "react";
import api from "../services/api";
import "../styles/JobForm.css";

function JobForm() {
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
        employer_id: 1 // şimdilik sabit
      });

      setMessage("İlan başarıyla oluşturuldu ✅");
      setTitle("");
      setDescription("");
      setLocation("");
      setSalary("");
    } catch (err) {
      setError(err.response?.data?.message || "İlan oluşturulamadı ❌");
    }
  };

  return (
    <div className="jobform-container">
      <div className="jobform-card">
        <h2 className="jobform-title">İlan Oluştur</h2>

        <form className="jobform" onSubmit={handleSubmit}>
          <input
            className="jobform-input"
            placeholder="İlan başlığı"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="jobform-textarea"
            placeholder="İlan açıklaması"
            value={description}
            required
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="jobform-input"
            placeholder="Konum"
            value={location}
            required
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            className="jobform-input"
            placeholder="Maaş"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />

          <button className="jobform-btn" type="submit">
            İlan Oluştur
          </button>
        </form>

        {message && <p className="jobform-success">{message}</p>}
        {error && <p className="jobform-error">{error}</p>}
      </div>
    </div>
  );
}

export default JobForm;
