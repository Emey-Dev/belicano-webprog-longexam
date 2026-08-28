import { useContext } from "react";
import AuthContext from "./AuthContext.jsx";
export const useAuth = () => useContext(AuthContext);
export const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  "Content-Type": "application/json",
});
