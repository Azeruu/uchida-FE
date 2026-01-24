import { useState, useEffect } from "react";
import config from "../config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async (retryCount = 0) => {
    try {
      console.log(
        "🔍 Checking authentication... (attempt",
        retryCount + 1,
        ")",
      );
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.log("❌ No token in localStorage");
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
        return;
      }

      console.log("✅ Token found, verifying with server...");
      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // PENTING: kirim cookies jika ada
      });

      console.log("📡 /me response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Auth check successful:", data.user);

        if (data.user?.role === "admin") {
          setIsAuthenticated(true);
          setUser(data.user);
          setError(null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setError("User tidak memiliki role admin");
          localStorage.removeItem("auth_token");
        }
      } else if (response.status === 401) {
        console.log("⚠️ Token expired atau tidak valid");
        setIsAuthenticated(false);
        setUser(null);
        setError("Token expired");
        localStorage.removeItem("auth_token");
      } else {
        // Jika error server, coba retry max 2x
        if (retryCount < 2) {
          console.log("🔄 Server error, retrying...");
          setTimeout(() => checkAuth(retryCount + 1), 1000);
          return;
        }
        throw new Error(`Auth check failed: ${response.status}`);
      }
    } catch (err: any) {
      console.error("❌ Auth check error:", err);
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message || "Failed to check authentication");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      console.log("🔄 Logging out...");
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    logout,
    refetch: checkAuth,
  };
};
