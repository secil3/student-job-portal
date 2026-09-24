const normalizedText = (value) =>
  typeof value === "string" ? value.trim() : "";

export const getStudentGreeting = (user) => {
  const name = normalizedText(user?.full_name);
  return name ? `Hoş geldin, ${name} 👋` : "Hoş geldin 👋";
};

export const getEmployerGreeting = (user) => {
  const name = normalizedText(user?.full_name);
  return name ? `Hoş geldiniz, ${name}` : "Hoş geldiniz";
};

export const getEmployerCompanyName = (user) =>
  normalizedText(user?.company_name) || "Şirket bilgisi belirtilmedi";
