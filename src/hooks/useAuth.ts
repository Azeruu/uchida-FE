// hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import config from "../config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify token dengan server
  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      console.log("🔐 [useAuth] Verifying token with server...");
      console.log("   Token preview:", token.substring(0, 30) + "...");

      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // PENTING: include token di header
        },
        credentials: "include", // PENTING: include cookies jika ada
      });

      console.log("   Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("   ✅ Token is valid");
        console.log("   User:", data.user);

        if (data.user?.role === "admin") {
          console.log("   ✅ User has admin role");
          setUser(data.user);
          setIsAuthenticated(true);
          setError(null);
          return true;
        } else {
          console.log("   ❌ User does not have admin role");
          setError("Not an admin user");
          return false;
        }
      } else if (response.status === 401) {
        console.log("   ❌ Token is invalid or expired (401)");
        // Jangan langsung hapus token, beri chance untuk refetch
        setError("Token expired or invalid");
        return false;
      } else {
        console.log("   ❌ Server error:", response.status);
        setError(`Server error: ${response.status}`);
        return false;
      }
    } catch (err: any) {
      console.error("   💥 Error verifying token:", err.message);
      setError(err.message);
      return false;
    }
  }, []);

  // Main auth check logic
  const checkAuth = useCallback(
    async (retryCount = 0) => {
      try {
        console.log(
          `\n🔍 [useAuth] Checking auth (attempt ${retryCount + 1})...`,
        );

        // 1. Check if token exists in localStorage
        const token = localStorage.getItem("auth_token");
        console.log(
          "   localStorage.auth_token:",
          token ? `✅ Found (${token.length} chars)` : "❌ Not found",
        );

        if (!token) {
          console.log("   → No token, user is not authenticated");
          setIsAuthenticated(false);
          setUser(null);
          setError(null);
          setLoading(false);
          return;
        }

        // 2. Verify token with server
        const isValid = await verifyToken(token);

        if (isValid) {
          console.log("   → Auth check PASSED");
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          console.log("   → Auth check FAILED");

          // Jika token tidak valid dan belum retry, coba sekali lagi
          if (retryCount < 1) {
            console.log("   → Retrying in 2 seconds...");
            setTimeout(() => checkAuth(retryCount + 1), 2000);
            return;
          }

          // Jika tetap gagal, hapus token
          console.log("   → Removing invalid token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("💥 [useAuth] Error:", err.message);
        setError(err.message);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    },
    [verifyToken],
  );

  // Run once on mount
  useEffect(() => {
    console.log("");
    console.log("═══════════════════════════════════════════");
    console.log("⚙️  useAuth Hook Initialized");
    console.log("═══════════════════════════════════════════");

    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      console.log("🚪 [useAuth] Logging out...");

      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {
        // Ignore logout error
      });

      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      setError(null);

      console.log("   ✅ Logout successful");
    } catch (err: any) {
      console.error("   ❌ Logout error:", err.message);
    }
  };

  const refetch = useCallback(() => {
    console.log("🔄 [useAuth] Manual refetch triggered");
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
