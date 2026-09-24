from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "demo-storage" / "resumes"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")

PROFILES = [
    {
        "filename": "Elif_Yilmaz_CV.pdf",
        "name": "Elif Yılmaz",
        "title": "Bilgisayar Mühendisliği - 4. sınıf",
        "summary": "Frontend geliştirme alanında kendini geliştiren, staj ve junior pozisyonlara başvuran son sınıf öğrencisi.",
        "skills": "React, JavaScript, HTML/CSS, Git, temel Node.js",
        "project": "Kurgusal öğrenci projesi: Responsive görev takip arayüzü",
    },
    {
        "filename": "Zeynep_Arslan_CV.pdf",
        "name": "Zeynep Arslan",
        "title": "Yönetim Bilişim Sistemleri - 4. sınıf",
        "summary": "Veri düzenleme, raporlama ve dijital iş süreçlerine ilgi duyan kurgusal demo öğrencisi.",
        "skills": "Elektronik tablolar, temel SQL, raporlama, süreç analizi",
        "project": "Kurgusal öğrenci projesi: Operasyon raporlama panosu",
    },
    {
        "filename": "Selin_Aksoy_CV.pdf",
        "name": "Selin Aksoy",
        "title": "İletişim Fakültesi - 3. sınıf",
        "summary": "Dijital içerik, sosyal medya planlama ve görsel iletişim alanlarına ilgi duyan kurgusal demo öğrencisi.",
        "skills": "İçerik planlama, metin yazımı, temel görsel tasarım, ekip iletişimi",
        "project": "Kurgusal öğrenci projesi: Sosyal medya içerik takvimi",
    },
]


def register_fonts():
    pdfmetrics.registerFont(TTFont("DemoSans", str(FONT_DIR / "Arial.ttf")))
    pdfmetrics.registerFont(TTFont("DemoSans-Bold", str(FONT_DIR / "Arial Bold.ttf")))


def create_resume(profile):
    output = OUTPUT_DIR / profile["filename"]
    document = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"{profile['name']} - Kurgusal Demo CV",
        author="StudentJob Demo",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "DemoTitle", parent=styles["Title"], fontName="DemoSans-Bold",
        fontSize=22, leading=27, textColor=colors.HexColor("#2C0735"), spaceAfter=4 * mm,
    )
    subtitle = ParagraphStyle(
        "DemoSubtitle", parent=styles["Normal"], fontName="DemoSans",
        fontSize=11, leading=15, textColor=colors.HexColor("#613DC1"), spaceAfter=8 * mm,
    )
    heading = ParagraphStyle(
        "DemoHeading", parent=styles["Heading2"], fontName="DemoSans-Bold",
        fontSize=12, leading=16, textColor=colors.HexColor("#2C0735"), spaceBefore=5 * mm, spaceAfter=2 * mm,
    )
    body = ParagraphStyle(
        "DemoBody", parent=styles["BodyText"], fontName="DemoSans",
        fontSize=10.5, leading=16, textColor=colors.HexColor("#333044"),
    )
    notice = ParagraphStyle(
        "DemoNotice", parent=styles["Normal"], fontName="DemoSans-Bold",
        fontSize=10, leading=14, alignment=TA_CENTER, textColor=colors.white,
        backColor=colors.HexColor("#613DC1"), borderPadding=8, spaceAfter=9 * mm,
    )

    story = [
        Paragraph("Kurgusal demo CV’sidir.", notice),
        Paragraph(profile["name"], title),
        Paragraph(profile["title"], subtitle),
        Paragraph("Profil", heading),
        Paragraph(profile["summary"], body),
        Paragraph("Beceriler", heading),
        Paragraph(profile["skills"], body),
        Paragraph("Örnek çalışma", heading),
        Paragraph(profile["project"], body),
        Spacer(1, 12 * mm),
        Paragraph(
            "Bu belgede gerçek telefon, adres, e-posta veya sosyal medya hesabı bulunmaz. "
            "Tüm içerik StudentJob tanıtımı için oluşturulmuştur.",
            body,
        ),
    ]
    document.build(story)


def main():
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for profile in PROFILES:
        create_resume(profile)


if __name__ == "__main__":
    main()
