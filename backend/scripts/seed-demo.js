import "dotenv/config";
import bcrypt from "bcrypt";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getDB } from "../src/config/db.js";
import { resumeStorageDirectory } from "../src/config/resumeStorage.js";

export const DEMO_DATABASE_NAME = "student_job_portal_demo";
export const DEMO_MARKER = "studentjob-isolated-demo";

const students = [
  {
    key: "elif",
    email: "elif.yilmaz@stu.adu.edu.tr",
    name: "Elif Yılmaz",
    major: "Bilgisayar Mühendisliği",
    classYear: "4. sınıf",
    city: "Aydın",
    skills: ["React", "JavaScript", "HTML/CSS", "Git", "temel Node.js"],
    description: "Frontend geliştirme alanında kendini geliştiren, staj ve junior pozisyonlara başvuran son sınıf öğrencisi.",
  },
  { key: "mert", email: "mert.kaya@demo.studentjob.invalid", name: "Mert Kaya", major: "İşletme", classYear: "3. sınıf" },
  { key: "zeynep", email: "zeynep.arslan@demo.studentjob.invalid", name: "Zeynep Arslan", major: "Yönetim Bilişim Sistemleri", classYear: "4. sınıf" },
  { key: "can", email: "can.demir@demo.studentjob.invalid", name: "Can Demir", major: "Elektrik-Elektronik Mühendisliği", classYear: "3. sınıf" },
  { key: "ece", email: "ece.aydin@demo.studentjob.invalid", name: "Ece Aydın", major: "Endüstri Mühendisliği", classYear: "4. sınıf" },
  { key: "selin", email: "selin.aksoy@demo.studentjob.invalid", name: "Selin Aksoy", major: "İletişim Fakültesi", classYear: "3. sınıf" },
];

const employers = [
  { key: "novabyte", email: "demo@novabyte.com", name: "NovaByte Teknoloji", description: "Web ve yazılım çözümleri geliştiren küçük ölçekli teknoloji şirketi." },
  { key: "aydinplus", email: "demo@aydinplus.invalid", name: "AydınPlus Danışmanlık", description: "İnsan kaynakları, operasyon ve işletme süreçlerinde danışmanlık hizmeti veren yerel firma." },
  { key: "mavikare", email: "demo@mavikare.invalid", name: "MaviKare Medya", description: "Sosyal medya yönetimi, içerik üretimi ve grafik tasarım hizmetleri sunan dijital ajans." },
  { key: "eksen", email: "demo@eksenlojistik.invalid", name: "Eksen Lojistik", description: "Bölgesel taşımacılık, operasyon ve raporlama süreçlerinde hizmet veren lojistik firması." },
];

const jobs = [
  {
    key: "frontend",
    employer: "novabyte",
    title: "Frontend Developer Stajyeri",
    location: "Uzaktan",
    description: "NovaByte Teknoloji, web projelerinde frontend ekibine destek olacak stajyer arıyor. Adayın temel React ve JavaScript bilgisine sahip olması, responsive tasarım konusunda fikir sahibi olması ve Git kullanabilmesi bekleniyor. Pozisyon uzaktan çalışma modelindedir.",
  },
  { key: "test", employer: "novabyte", title: "Yazılım Test Stajyeri", location: "İzmir / Hibrit", description: "Web uygulamalarının manuel test süreçlerine destek olacak, hata kayıtlarını düzenli biçimde raporlayacak bir stajyer arıyoruz." },
  { key: "hr", employer: "aydinplus", title: "İnsan Kaynakları Stajyeri", location: "Aydın", description: "İşe alım, aday iletişimi ve temel insan kaynakları dokümantasyonu süreçlerine destek verecek bir stajyer arıyoruz." },
  { key: "office", employer: "aydinplus", title: "Ofis ve Operasyon Stajyeri", location: "Aydın", description: "Günlük ofis düzeni, veri girişi ve operasyon takibinde ekibe destek olacak düzenli bir stajyer arıyoruz." },
  { key: "social", employer: "mavikare", title: "Sosyal Medya Stajyeri", location: "Uzaktan", description: "Sosyal medya içerik takviminin hazırlanmasına ve yayın süreçlerinin takibine destek olacak yaratıcı bir stajyer arıyoruz." },
  { key: "design", employer: "mavikare", title: "Grafik Tasarım Stajyeri", location: "İzmir / Hibrit", description: "Dijital kampanyalar için sade görseller ve sosyal medya içerikleri hazırlama süreçlerine destek olacak bir stajyer arıyoruz." },
  { key: "logistics", employer: "eksen", title: "Lojistik Operasyon Stajyeri", location: "Aydın / İzmir", description: "Sevkiyat planlama, operasyon takibi ve temel kayıt süreçlerinde ekibe destek olacak bir stajyer arıyoruz." },
  { key: "reporting", employer: "eksen", title: "Veri Raporlama Stajyeri", location: "Hibrit", description: "Operasyon verilerinin düzenlenmesi ve periyodik raporların hazırlanmasına destek olacak analitik bir stajyer arıyoruz." },
];

const applications = [
  ["elif", "frontend", "accepted"],
  ["elif", "test", "pending"],
  ["mert", "hr", "pending"],
  ["mert", "office", "accepted"],
  ["zeynep", "reporting", "accepted"],
  ["zeynep", "social", "rejected"],
  ["can", "logistics", "pending"],
  ["ece", "reporting", "pending"],
  ["selin", "social", "accepted"],
  ["selin", "design", "rejected"],
];

const resumeFiles = [
  ["elif", "Elif_Yilmaz_CV.pdf"],
  ["zeynep", "Zeynep_Arslan_CV.pdf"],
  ["selin", "Selin_Aksoy_CV.pdf"],
];

export const assertDemoEnvironment = ({ demoMode, databaseName, marker }) => {
  if (demoMode !== "true") {
    throw new Error("Demo seed refused: DEMO_MODE must be true");
  }
  if (databaseName !== DEMO_DATABASE_NAME) {
    throw new Error("Demo seed refused: unexpected database name");
  }
  if (marker !== DEMO_MARKER) {
    throw new Error("Demo seed refused: demo database marker is missing");
  }
};

const requirePasswords = () => {
  const values = {
    student: process.env.DEMO_STUDENT_PASSWORD,
    employer: process.env.DEMO_EMPLOYER_PASSWORD,
    admin: process.env.DEMO_ADMIN_PASSWORD,
  };
  for (const [role, value] of Object.entries(values)) {
    if (typeof value !== "string" || value.length < 12) {
      throw new Error(`Demo seed refused: DEMO_${role.toUpperCase()}_PASSWORD must contain at least 12 characters`);
    }
  }
  return values;
};

const upsertUser = async (connection, user, passwordHash, role) => {
  await connection.query(
    `INSERT INTO users
       (email, full_name, password, role, is_verified, status, is_active, university, major)
     VALUES (?, ?, ?, ?, 1, 'approved', 1, ?, ?)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name), password = VALUES(password),
       role = VALUES(role), is_verified = 1,
       status = 'approved', is_active = 1, deactivated_at = NULL,
       university = VALUES(university), major = VALUES(major)`,
    [
      user.email,
      role === "student" ? user.name : null,
      passwordHash,
      role,
      role === "student" ? "Aydın Adnan Menderes Üniversitesi" : null,
      role === "student" ? `${user.major} - ${user.classYear}` : null,
    ]
  );
  const [rows] = await connection.query("SELECT id FROM users WHERE email = ?", [user.email]);
  return rows[0].id;
};

const upsertJob = async (connection, job, employerId) => {
  const [existing] = await connection.query(
    "SELECT id FROM jobs WHERE employer_id = ? AND title = ? LIMIT 1",
    [employerId, job.title]
  );
  if (existing.length > 0) {
    await connection.query(
      `UPDATE jobs SET description = ?, location = ?, salary = NULL,
       is_active = 1, deactivated_at = NULL WHERE id = ?`,
      [job.description, job.location, existing[0].id]
    );
    return existing[0].id;
  }
  const [result] = await connection.query(
    `INSERT INTO jobs (employer_id, title, description, location, salary, is_active)
     VALUES (?, ?, ?, ?, NULL, 1)`,
    [employerId, job.title, job.description, job.location]
  );
  return result.insertId;
};

export const seedDemoData = async (connection) => {
  const passwords = requirePasswords();
  const [databaseRows] = await connection.query("SELECT DATABASE() AS database_name");
  const [markerRows] = await connection.query("SELECT marker FROM demo_environment WHERE id = 1");
  assertDemoEnvironment({
    demoMode: process.env.DEMO_MODE,
    databaseName: databaseRows[0]?.database_name,
    marker: markerRows[0]?.marker,
  });

  for (const [, filename] of resumeFiles) {
    await fs.access(path.join(resumeStorageDirectory, filename));
  }

  const passwordHashes = {
    student: await bcrypt.hash(passwords.student, 10),
    employer: await bcrypt.hash(passwords.employer, 10),
    admin: await bcrypt.hash(passwords.admin, 10),
  };

  await connection.beginTransaction();
  try {
    const userIds = {};
    for (const student of students) {
      userIds[student.key] = await upsertUser(connection, student, passwordHashes.student, "student");
      await connection.query(
        `INSERT INTO demo_user_profiles
           (user_id, display_name, class_year, city, skills, profile_description)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name),
           class_year = VALUES(class_year), city = VALUES(city),
           skills = VALUES(skills), profile_description = VALUES(profile_description)`,
        [userIds[student.key], student.name, student.classYear, student.city ?? null, JSON.stringify(student.skills ?? []), student.description ?? null]
      );
    }

    const employerIds = {};
    for (const employer of employers) {
      employerIds[employer.key] = await upsertUser(connection, employer, passwordHashes.employer, "employer");
      await connection.query(
        `INSERT INTO company_profiles (user_id, company_name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), description = VALUES(description)`,
        [employerIds[employer.key], employer.name, employer.description]
      );
    }

    await upsertUser(
      connection,
      { email: "admin@digipath.demo" },
      passwordHashes.admin,
      "admin"
    );

    const jobIds = {};
    for (const job of jobs) {
      jobIds[job.key] = await upsertJob(connection, job, employerIds[job.employer]);
    }

    const resumeIds = {};
    for (const [studentKey, filename] of resumeFiles) {
      const [existing] = await connection.query(
        "SELECT id FROM resumes WHERE user_id = ? AND name = ? LIMIT 1",
        [userIds[studentKey], filename]
      );
      if (existing.length > 0) {
        resumeIds[studentKey] = existing[0].id;
        await connection.query(
          "UPDATE resumes SET file_path = ? WHERE id = ?",
          [`/uploads/${filename}`, existing[0].id]
        );
      } else {
        const [result] = await connection.query(
          "INSERT INTO resumes (user_id, name, file_path) VALUES (?, ?, ?)",
          [userIds[studentKey], filename, `/uploads/${filename}`]
        );
        resumeIds[studentKey] = result.insertId;
      }
    }

    for (const [studentKey, jobKey, status] of applications) {
      await connection.query(
        `INSERT INTO applications (job_id, student_id, status, resume_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), resume_id = VALUES(resume_id)`,
        [jobIds[jobKey], userIds[studentKey], status, resumeIds[studentKey] ?? null]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

const run = async () => {
  const connection = await getDB();
  try {
    await seedDemoData(connection);
    console.log("Isolated demo data is ready");
  } finally {
    await connection.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
