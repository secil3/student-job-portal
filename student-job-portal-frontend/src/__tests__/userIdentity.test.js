import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getEmployerCompanyName,
  getEmployerGreeting,
  getStudentGreeting,
} from "../utils/userDisplay.js";

const register = await readFile(new URL("../pages/Register.jsx", import.meta.url), "utf8");
const studentDashboard = await readFile(
  new URL("../pages/student/StudentDashboard.jsx", import.meta.url),
  "utf8"
);
const employerDashboard = await readFile(
  new URL("../pages/employer/EmployerDashboard.jsx", import.meta.url),
  "utf8"
);
const authContext = await readFile(
  new URL("../context/AuthContext.jsx", import.meta.url),
  "utf8"
);

test("student and employer registration collect separate identity fields", () => {
  assert.match(register, /role === "employer" \? "Yetkili Ad Soyad" : "Ad Soyad"/);
  assert.match(register, />Şirket Adı</);
  assert.match(register, /fullName/);
  assert.match(register, /companyName: role === "employer" \? companyName : undefined/);
  assert.match(register, /maxLength=\{150\}/);
  assert.match(register, /maxLength=\{255\}/);
});

test("session keeps the complete safe user payload for dashboard greetings", () => {
  assert.match(authContext, /localStorage\.setItem\("user", JSON\.stringify\(userData\)\)/);
  assert.match(studentDashboard, /getStudentGreeting\(user\)/);
  assert.match(employerDashboard, /getEmployerGreeting\(user\)/);
  assert.match(employerDashboard, /getEmployerCompanyName\(user\)/);
});

test("dashboard greetings use names and keep natural legacy fallbacks", () => {
  assert.equal(
    getStudentGreeting({ full_name: "  Elif Yılmaz  " }),
    "Hoş geldin, Elif Yılmaz 👋"
  );
  assert.equal(getStudentGreeting({ full_name: null }), "Hoş geldin 👋");
  assert.equal(
    getEmployerGreeting({ full_name: "  Ada Kaya  " }),
    "Hoş geldiniz, Ada Kaya"
  );
  assert.equal(getEmployerGreeting({}), "Hoş geldiniz");
  assert.equal(
    getEmployerCompanyName({ company_name: "  Örnek Teknoloji  " }),
    "Örnek Teknoloji"
  );
  assert.equal(getEmployerCompanyName({ company_name: null }), "Şirket bilgisi belirtilmedi");
});
