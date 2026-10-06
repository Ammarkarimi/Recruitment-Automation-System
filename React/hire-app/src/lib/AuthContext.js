import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("hr_token")));

  useEffect(() => {
    if (!localStorage.getItem("hr_token")) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("hr_token"))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((token, userData) => {
    localStorage.setItem("hr_token", token);
    setUser(userData);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("hr_token");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
