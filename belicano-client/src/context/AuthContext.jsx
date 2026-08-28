import { createContext, useCallback, useState } from "react";

const AuthContext = createContext(null);
const storageKey = "bdexchangeAuth";

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || null;
    } catch {
      return null;
    }
  });
  const login = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSession(data);
  };
  const logout = () => {
    localStorage.removeItem(storageKey);
    setSession(null);
  };
  const updateUser = useCallback((user) => {
    setSession((current) => {
      if (!current) return current;
      const nextSession = { ...current, user };
      localStorage.setItem(storageKey, JSON.stringify(nextSession));
      return nextSession;
    });
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        token: session?.token || "",
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
