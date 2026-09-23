const labels = {
  all: "Tümü",
  pending: "Beklemede",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  approved: "Onaylandı",
  active: "Aktif",
  inactive: "Pasif",
  student: "Öğrenci",
  employer: "İşveren",
  admin: "Yönetici",
};

export const getUiLabel = (value) => labels[value] || value;
