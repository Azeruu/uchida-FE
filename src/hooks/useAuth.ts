// hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import config from "../config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user?.role === "admin") {
          setUser(data.user);
          setIsAuthenticated(true);
          setError(null);
          return true;
        }
        setError("Not an admin user");
        return false;
      }
      if (response.status === 401) {
        setError("Unauthorized");
        return false;
      }
      setError(`Server error: ${response.status}`);
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // Main auth check logic
  const checkAuth = useCallback(
    async (retryCount = 0) => {
      try {
        const isValid = await verifySession();

        if (isValid) {
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          if (retryCount < 1) {
            setTimeout(() => checkAuth(retryCount + 1), 2000);
            return;
          }
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    },
    [verifySession],
  );

  // Run once on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {
      });

      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refetch = useCallback(() => {
    setLoading(true);
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    logout,
    refetch,
  };
};
