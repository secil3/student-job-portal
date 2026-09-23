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

export const getJobApplyAvailability = ({
  jobId,
  appliedJobIds,
  applicationsLoaded,
  resumesLoaded,
  resumesError,
  resumes,
  selectedResume,
}) => {
  const applicationState = getJobApplicationState(
    jobId,
    appliedJobIds,
    applicationsLoaded
  );

  if (applicationState === "applied") {
    return { state: "applied", disabled: true, label: "Başvuruldu" };
  }

  if (applicationState === "unknown" || !resumesLoaded || resumesError) {
    return {
      state: "unavailable",
      disabled: true,
      label: "Başvuru kullanılamıyor",
    };
  }

  if (resumes.length === 0) {
    return { state: "resume-required", disabled: true, label: "CV gerekli" };
  }

  const hasValidSelection = resumes.some(
    (resume) => Number(resume.id) === Number(selectedResume)
  );

  if (!hasValidSelection) {
    return {
      state: "select-resume",
      disabled: true,
      label: "Başvurmak için CV seçin",
    };
  }

  return { state: "available", disabled: false, label: "Başvur" };
};
