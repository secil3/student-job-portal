export const getAppliedJobIds = (applications) => new Set(
  (Array.isArray(applications) ? applications : [])
    .map((application) => Number(application.job_id))
    .filter(Number.isInteger)
);

export const getJobApplicationState = (
  jobId,
  appliedJobIds,
  applicationsLoaded
) => {
  if (!applicationsLoaded) return "unknown";
  return appliedJobIds.has(Number(jobId)) ? "applied" : "available";
};
