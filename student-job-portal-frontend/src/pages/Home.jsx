import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/Home.css";

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = {
    student: "/student",
    employer: "/employer",
    admin: "/admin/dashboard",
  }[user?.role];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-layout">
          <div className="hero-content">
            <span className="hero-eyebrow">Student opportunities, made simpler</span>
            <h1 className="hero-title">
              Build your next step with <span>StudentJob.</span>
            </h1>
            <p className="hero-subtitle">
              A focused space for students to apply with their CV and for employers
              to manage opportunities and applicants.
            </p>

            <div className="hero-actions">
              {!user ? (
                <>
                  <Link to="/register" className="home-btn home-btn-primary">
                    Register
                  </Link>
                  <Link to="/login" className="home-btn home-btn-secondary">
                    Login
                  </Link>
                </>
              ) : (
                dashboardPath && (
                  <Link to={dashboardPath} className="home-btn home-btn-primary">
                    Go to Dashboard
                  </Link>
                )
              )}
            </div>
          </div>

          <aside className="product-preview" aria-label="Illustrative StudentJob dashboard preview">
            <div className="preview-toolbar">
              <div className="preview-dots" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <span className="preview-note">Illustrative preview · No real data</span>
            </div>

            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <span className="preview-kicker">Example opportunity</span>
                  <h2>Product Design Intern</h2>
                </div>
                <span className="preview-location">Remote</span>
              </div>

              <p className="preview-description">
                Support a product team with research, interface design and clear
                documentation.
              </p>

              <div className="preview-grid">
                <div className="preview-mini-card">
                  <span className="mini-icon mini-icon-cv" aria-hidden="true">PDF</span>
                  <div>
                    <span className="mini-label">Selected CV</span>
                    <strong>Student-CV.pdf</strong>
                  </div>
                </div>

                <div className="preview-mini-card">
                  <span className="mini-icon mini-icon-status" aria-hidden="true">✓</span>
                  <div>
                    <span className="mini-label">Application status</span>
                    <strong>Accepted</strong>
                  </div>
                </div>
              </div>

              <div className="preview-footer">
                <span>Job post</span>
                <span className="preview-divider"></span>
                <span>CV attached</span>
                <span className="preview-divider"></span>
                <span>Decision tracked</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="home-roles" aria-labelledby="roles-title">
        <div className="home-section-heading">
          <span>One platform, two clear paths</span>
          <h2 id="roles-title">Designed around how you work</h2>
        </div>

        <div className="role-grid">
          <article className="role-card">
            <div className="role-icon" aria-hidden="true">S</div>
            <div>
              <span className="role-label">For students</span>
              <h3>Find a role and apply with your CV</h3>
              <p>
                Browse available jobs, choose an uploaded PDF CV and track each
                application from your dashboard.
              </p>
            </div>
          </article>

          <article className="role-card">
            <div className="role-icon role-icon-employer" aria-hidden="true">E</div>
            <div>
              <span className="role-label">For employers</span>
              <h3>Manage job posts and applicants</h3>
              <p>
                Publish and edit job listings, review submitted CVs and manage
                application decisions in one place.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
