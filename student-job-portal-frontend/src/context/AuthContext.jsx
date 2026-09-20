import { useState } from "react";
import { AuthContext } from "./authContextStore";

const clearStoredSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

const loadStoredSession = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  if (!storedUser || !storedToken) {
    clearStoredSession();
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user?.id || !user?.role) {
      clearStoredSession();
      return { user: null, token: null };
    }

    // Remove the legacy duplicate role entry if it exists.
    localStorage.removeItem("role");
    return { user, token: storedToken };
  } catch {
    clearStoredSession();
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(loadStoredSession);

  const login = (userData, jwtToken) => {
    setSession({ user: userData, token: jwtToken });

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
    localStorage.removeItem("role");
  };

  const logout = () => {
    setSession({ user: null, token: null });
    clearStoredSession();
  };

  const { user, token } = session;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role ?? null,
        login,
        logout,
        loading: false,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
