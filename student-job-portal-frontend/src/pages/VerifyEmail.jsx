import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import "../styles/VerifyEmail.css";

const readToken = () => {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return fragment.get("token");
};

export default function VerifyEmail() {
  const location = useLocation();
  const [status, setStatus] = useState(readToken() ? "loading" : "waiting");
  const [message, setMessage] = useState(
    new URLSearchParams(location.search).get("sent") === "1"
      ? "We sent a verification link to your ADU student email."
      : "Open the verification link from your email, or request a new one."
  );
  const [email, setEmail] = useState(location.state?.email || "");
  const [resending, setResending] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    const token = readToken();
    if (!token || requested.current) return;
    requested.current = true;

    api.post("/auth/verify-email", { token })
      .then(() => {
        window.history.replaceState(null, "", "/verify-email");
        setStatus("success");
        setMessage("Your ADU student email has been verified successfully.");
      })
      .catch((error) => {
        setStatus(error.response?.status === 400 ? "invalid" : "error");
        setMessage(
          error.response?.status === 400
            ? "This verification link is invalid, expired, or has already been used."
            : "We could not verify your email right now. Please try again later."
        );
      });
  }, []);

  const handleResend = async (event) => {
    event.preventDefault();
    setResending(true);

    try {
      const response = await api.post("/auth/resend-verification", { email });
      setMessage(response.data.message);
      setStatus("waiting");
    } catch (error) {
      setMessage(
        error.response?.data?.message
          || "The verification request could not be completed. Please try again later."
      );
      setStatus("error");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="verify-email-page">
      <section className="verify-email-card" aria-live="polite">
        <span className={`verify-email-badge verify-email-badge--${status}`}>
          {status === "success" ? "Verified" : "Email verification"}
        </span>
        <h1>Verify your student email</h1>
        <p>{status === "loading" ? "Verifying your email..." : message}</p>

        {status !== "success" && status !== "loading" && (
          <form className="verify-email-form" onSubmit={handleResend}>
            <label htmlFor="verification-email">ADÜ student email</label>
            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@stu.adu.edu.tr"
              autoComplete="email"
              required
            />
            <button type="submit" disabled={resending}>
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </form>
        )}

        {status === "success" && <Link to="/login">Continue to login</Link>}
      </section>
    </main>
  );
}
