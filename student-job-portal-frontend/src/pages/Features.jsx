import { Link } from "react-router-dom";
import "../styles/PublicPages.css";

export default function Features() {
  return (
    <div className="public-page">
      <header className="public-page-header">
        <span>StudentJob özellikleri</span>
        <h1>Başvuru ve hazırlık araçları, tek yerde.</h1>
        <p>İlan seçimiyle başlayan öğrenci akışını ve sunulan araçları tanıyın.</p>
      </header>

      <section aria-labelledby="features-title">
        <h2 id="features-title">Neler yapabilirsiniz?</h2>
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
        <Link to="/about">Nasıl çalıştığını öğren</Link>
        <Link to="/register">Kayıt Ol</Link>
        <Link to="/login">Giriş Yap</Link>
      </div>
    </div>
  );
}
