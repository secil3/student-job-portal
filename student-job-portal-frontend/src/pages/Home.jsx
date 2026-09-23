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
            <span className="hero-eyebrow">Öğrenci fırsatları artık daha sade</span>
            <h1 className="hero-title">
              Geleceğinize <span>StudentJob</span> ile yön verin.
            </h1>
            <p className="hero-subtitle">
              Öğrencilerin CV’leriyle başvurduğu, işverenlerin ilanları ve
              adayları yönettiği odaklı bir platform.
            </p>

            <div className="hero-actions">
              {!user ? (
                <>
                  <Link to="/register" className="home-btn home-btn-primary">
                    Kayıt Ol
                  </Link>
                  <Link to="/login" className="home-btn home-btn-secondary">
                    Giriş Yap
                  </Link>
                </>
              ) : (
                dashboardPath && (
                  <Link to={dashboardPath} className="home-btn home-btn-primary">
                    Panele Git
                  </Link>
                )
              )}
            </div>
          </div>

          <aside className="product-preview" aria-label="Temsili StudentJob panel önizlemesi">
            <div className="preview-toolbar">
              <div className="preview-dots" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <span className="preview-note">Temsili önizleme · Gerçek veri içermez</span>
            </div>

            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <span className="preview-kicker">Örnek fırsat</span>
                  <h2>Ürün Tasarımı Stajyeri</h2>
                </div>
                <span className="preview-location">Uzaktan</span>
              </div>

              <p className="preview-description">
                Bir ürün ekibine araştırma, arayüz tasarımı ve anlaşılır
                dokümantasyon süreçlerinde destek olun.
              </p>

              <div className="preview-grid">
                <div className="preview-mini-card">
                  <span className="mini-icon mini-icon-cv" aria-hidden="true">PDF</span>
                  <div>
                    <span className="mini-label">Seçilen CV</span>
                    <strong>Ogrenci-CV.pdf</strong>
                  </div>
                </div>

                <div className="preview-mini-card">
                  <span className="mini-icon mini-icon-status" aria-hidden="true">✓</span>
                  <div>
                    <span className="mini-label">Başvuru durumu</span>
                    <strong>Kabul Edildi</strong>
                  </div>
                </div>
              </div>

              <div className="preview-footer">
                <span>İş ilanı</span>
                <span className="preview-divider"></span>
                <span>CV eklendi</span>
                <span className="preview-divider"></span>
                <span>Karar takip edildi</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="home-roles" aria-labelledby="roles-title">
        <div className="home-section-heading">
          <span>Tek platform, iki açık yol</span>
          <h2 id="roles-title">İhtiyacınıza göre tasarlandı</h2>
        </div>

        <div className="role-grid">
          <article className="role-card">
            <div className="role-icon" aria-hidden="true">S</div>
            <div>
              <span className="role-label">Öğrenciler için</span>
              <h3>İlanları bulun ve CV’nizle başvurun</h3>
              <p>
                İlanları inceleyin, yüklediğiniz PDF CV’lerden birini seçin ve
                başvurularınızı panelinizden takip edin.
              </p>
            </div>
          </article>

          <article className="role-card">
            <div className="role-icon role-icon-employer" aria-hidden="true">E</div>
            <div>
              <span className="role-label">İşverenler için</span>
              <h3>İlanları ve adayları yönetin</h3>
              <p>
                İlan yayınlayıp düzenleyin, gönderilen CV’leri inceleyin ve
                başvuru kararlarını tek yerden yönetin.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-more" aria-label="StudentJob hakkında daha fazlası">
        <article className="home-more-card">
          <span>Nasıl çalışır?</span>
          <h2>Öğrenciden işverene, anlaşılır bir süreç.</h2>
          <p>Kayıt, doğrulama, ilan ve başvuru adımlarını öğrenin.</p>
          <Link to="/about">StudentJob hakkında →</Link>
        </article>
        <article className="home-more-card">
          <span>Özellikler</span>
          <h2>Başvurularınız için pratik araçlar.</h2>
          <p>CV ile başvurmayı, takibi ve AI hazırlık araçlarını keşfedin.</p>
          <Link to="/about">Özellikleri keşfet →</Link>
        </article>
      </section>
    </div>
  );
}
