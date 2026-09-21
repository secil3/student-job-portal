const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;
const requests = new Map();

export const consumeVerificationRequest = (key, now = Date.now()) => {
  const recentRequests = (requests.get(key) || [])
    .filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS) {
    requests.set(key, recentRequests);
    return false;
  }

  recentRequests.push(now);
  requests.set(key, recentRequests);
  return true;
};

export const resetVerificationRateLimitsForTests = () => {
  requests.clear();
};
