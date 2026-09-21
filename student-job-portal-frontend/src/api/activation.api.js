import api from "../services/api";

export const updateUserActivation = (userId, isActive) =>
  api.patch(`/admin/users/${userId}/activation`, { isActive });

export const updateJobActivation = (jobId, isActive) =>
  api.patch(`/jobs/${jobId}/activation`, { isActive });
