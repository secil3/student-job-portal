const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const requests = new Map();

export const consumeApplicationMessageRequest = (userId, now = Date.now()) => {
  const key = String(userId);
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

export const resetApplicationMessageRateLimitsForTests = () => {
  requests.clear();
};
