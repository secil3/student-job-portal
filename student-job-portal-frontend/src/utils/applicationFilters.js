export const APPLICATION_FILTERS = ["all", "pending", "accepted", "rejected"];

export const filterApplicationsByStatus = (applications, activeFilter) => {
  const safeApplications = Array.isArray(applications) ? applications : [];

  if (activeFilter === "all") return safeApplications;

  return safeApplications.filter(
    (application) => application.status === activeFilter
  );
};
