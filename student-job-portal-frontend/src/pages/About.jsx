import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/PublicPages.css";

export default function About() {
  const { user } = useAuth();
  const authenticatedCta = {
    student: { to: "/student/jobs", label: "İlanları Gör" },
    employer: { to: "/employer", label: "İşveren Paneline Git" },
    admin: { to: "/admin/dashboard", label: "Yönetici Paneline Git" },
  }[user?.role];

  return (
    <div className="public-page">
      <header className="public-page-header">
        <span>StudentJob hakkında</span>
        <h1>Öğrenciler ve işverenler için daha açık bir yol.</h1>
        <p>
          StudentJob, öğrencilerin ilanları inceleyip hazır PDF CV’leriyle
          başvurduğu; işverenlerin ilan ve başvuruları yönettiği bir platformdur.
        </p>
      </header>

      <section className="public-page-section" aria-labelledby="about-flow-title">
        <h2 id="about-flow-title">Nasıl Çalışır?</h2>
        <div className="public-page-grid">
          <article className="public-page-card">
            <span>Öğrenciler için</span>
            <h3>Başvurularınızı tek yerden takip edin</h3>
            <ol>
              <li>ADÜ öğrenci e-postanızla kayıt olun ve adresinizi doğrulayın.</li>
              <li>İlanları inceleyin, hazır PDF CV’nizi yükleyip seçin.</li>
              <li>CV’nizle başvurun ve başvuru durumunuzu takip edin.</li>
            </ol>
          </article>
          <article className="public-page-card">
            <span>İşverenler için</span>
            <h3>İlan ve başvuruları yönetin</h3>
            <ol>
              <li>İşveren hesabınızı oluşturun ve yönetici onayını bekleyin.</li>
              <li>Onaydan sonra ilan yayınlayın.</li>
              <li>Başvuruları ve ilgili CV’leri inceleyip kabul veya ret kararı verin.</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="public-page-section public-page-features" id="features" aria-labelledby="about-features-title">
        <div className="public-page-section-heading">
          <span>StudentJob özellikleri</span>
          <h2 id="about-features-title">Başvuru ve hazırlık araçları</h2>
          <p>İlan seçimiyle başlayan öğrenci akışını destekleyen araçları tanıyın.</p>
        </div>
        <div className="public-page-grid">
          <article className="public-page-card">
            <span>CV ile başvuru</span>
            <h3>Hazır PDF CV’nizi seçin</h3>
            <p>İlanları inceleyin, yüklediğiniz PDF CV’lerden birini seçerek başvurun.</p>
          </article>
          <article className="public-page-card">
            <span>Başvuru takibi</span>
            <h3>Durumu takip edin</h3>
            <p>Başvurularınızı ve beklemede, kabul ya da ret durumlarını görüntüleyin.</p>
          </article>
          <article className="public-page-card">
            <span>AI Başvuru Mesajı</span>
            <h3>Metninizi hazırlayın ve düzenleyin</h3>
            <p>
              Seçtiğiniz ilana göre kısa bir mesaj taslağı oluşturun; göndermeden
              önce gözden geçirip düzenleyebilir veya kopyalayabilirsiniz.
              Mesaj başvurunuza otomatik eklenmez ve işverene gönderilmez.
            </p>
          </article>
          <article className="public-page-card">
            <span>AI Mülakat Hazırlığı</span>
            <h3>Üç örnek soruyla hazırlanın</h3>
            <p>
              İlan için üç örnek mülakat sorusu ve her soru için kısa bir hazırlık
              ipucu alın. Bunlar işverenin gerçek mülakat soruları değildir.
            </p>
          </article>
        </div>
        <p className="public-page-note">
          AI araçlarına yalnızca gerekli ilan bilgileri ve mesaj için yazdığınız
          notlar gönderilir; CV’niz AI sağlayıcısına gönderilmez.
          Bu araçları öğrenci hesabınızla bir ilan seçtikten sonra kullanabilirsiniz.
        </p>
      </section>

      <div className="public-page-actions">
        {!user ? (
          <>
            <Link to="/register">Kayıt Ol</Link>
            <Link to="/login">Giriş Yap</Link>
          </>
        ) : (
          authenticatedCta && (
            <Link to={authenticatedCta.to}>{authenticatedCta.label}</Link>
          )
        )}
      </div>
    </div>
  );
}
