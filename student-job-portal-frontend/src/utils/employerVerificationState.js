export const getEmployerVerificationView = ({
  loading,
  loadError,
  employers,
}) => {
  if (loading) return "loading";
  if (loadError) return "error";
  return employers.length === 0 ? "empty" : "list";
};

export const removeEmployerFromPendingList = (employers, employerId) =>
  employers.filter((employer) => Number(employer.id) !== Number(employerId));
