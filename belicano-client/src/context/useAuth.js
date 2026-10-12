import { useContext } from "react";
import AuthContext from "./AuthContext.jsx";
export const useAuth = () => useContext(AuthContext);
export const authHeaders = (token, includeJsonContentType = true) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
});
