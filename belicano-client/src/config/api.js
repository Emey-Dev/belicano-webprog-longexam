const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const apiUrl = (path) =>
  `${apiBaseUrl}/${String(path).replace(/^\//, "")}`;
