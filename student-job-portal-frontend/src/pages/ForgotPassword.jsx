import { useState } from "react";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage("Password reset link generated ✅");
      setResetLink(res.data.resetLink);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate reset link ❌"
      );
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2>Forgot Password</h2>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button type="submit">Send Reset Link</button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Reset link (email yerine ekranda gösteriyoruz) */}
      {resetLink && (
        <p>
          <a href={resetLink} target="_blank" rel="noreferrer">
            Click here to reset your password
          </a>
        </p>
      )}
    </div>
  );
}
