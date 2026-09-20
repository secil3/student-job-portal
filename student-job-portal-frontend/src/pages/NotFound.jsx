import { Link } from "react-router-dom";
import "../styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <span className="not-found-code">404</span>
        <h1 id="not-found-title">Page not found</h1>
        <p>
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <Link to="/" className="not-found-link">
          Return to home
        </Link>
      </section>
    </div>
  );
}
