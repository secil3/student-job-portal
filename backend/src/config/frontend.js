export const getFrontendUrl = () => {
  const value = process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173");
  if (!value) throw new Error("FRONTEND_URL is required in production");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("FRONTEND_URL must be an HTTP(S) origin without a path or credentials");
  }
  return url.origin;
};
