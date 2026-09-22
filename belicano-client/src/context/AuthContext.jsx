import { createContext, useCallback, useEffect, useState } from "react";

const AuthContext = createContext(null);
const storageKey = "bdexchangeAuth";
const inactivityTimeout = 10 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || null;
    } catch {
      return null;
    }
  });
  const [sessionEndedReason, setSessionEndedReason] = useState("");
  const sessionToken = session?.token || "";
  const login = (data) => {
    setSessionEndedReason("");
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSession(data);
  };
  const logout = () => {
    localStorage.removeItem(storageKey);
    setSession(null);
    setSessionEndedReason("");
  };
  useEffect(() => {
    if (!sessionToken) return undefined;
    let timeoutId;
    const resetInactivityTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        localStorage.removeItem(storageKey);
        setSession(null);
        setSessionEndedReason("inactivity");
      }, inactivityTimeout);
    };
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetInactivityTimer),
    );
    resetInactivityTimer();
    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetInactivityTimer),
      );
    };
  }, [sessionToken]);
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== storageKey) return;
      if (event.newValue === null) {
        setSession(null);
        return;
      }
      try {
        setSession(JSON.parse(event.newValue));
      } catch {
        setSession(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
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
        sessionEndedReason,
        clearSessionEndedReason: () => setSessionEndedReason(""),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
