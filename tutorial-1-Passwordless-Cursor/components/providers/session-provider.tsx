"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SessionExpiredModal } from "@/components/auth/session-expired-modal";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

interface SessionContextType {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [expiredReason, setExpiredReason] = useState<string>();

  // Fetch initial session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/session");
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Monitor session validity (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/session/validate");
        if (!response.ok) {
          const data = await response.json();
          setSessionExpired(true);
          setExpiredReason(data.reason);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Session validation failed:", error);
      }
    }, parseInt(process.env.SESSION_VALIDATION_INTERVAL || "30000"));

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <SessionContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
      <SessionExpiredModal open={sessionExpired} reason={expiredReason} />
    </SessionContext.Provider>
  );
}



