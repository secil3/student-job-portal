export const AI_PROVIDER_NOT_CONFIGURED = "AI_PROVIDER_NOT_CONFIGURED";

export const generateApplicationMessage = async () => {
  const error = new Error("AI application-message provider is not configured");
  error.code = AI_PROVIDER_NOT_CONFIGURED;
  throw error;
};
