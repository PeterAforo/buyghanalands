"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CSRFContextType {
  token: string | null;
  refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType>({
  token: null,
  refreshToken: async () => {},
});

export function useCSRF() {
  return useContext(CSRFContext);
}

interface CSRFProviderProps {
  children: ReactNode;
  initialToken?: string;
}

export function CSRFProvider({ children, initialToken }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(initialToken || null);

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
      }
    } catch {
      // Silently fail - CSRF will be validated server-side
    }
  };

  useEffect(() => {
    if (!token) {
      refreshToken();
    }
  }, [token]);

  return (
    <CSRFContext.Provider value={{ token, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
}

/**
 * Hook to get fetch options with CSRF token
 */
export function useCSRFFetch() {
  const { token } = useCSRF();

  return {
    headers: token ? { "x-csrf-token": token } : {},
    getHeaders: () => (token ? { "x-csrf-token": token } : {}),
  };
}
