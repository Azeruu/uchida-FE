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
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
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
          setIsAuthenticated(false);
          return false;
        }
      } else if (response.status === 401) {
        console.log("   ❌ Token is invalid or expired (401)");
        // 🔴 PENTING: Jangan hapus token di sini
        // Biarkan token tetap di localStorage
        setError("Token expired or invalid");
        setIsAuthenticated(false);
        return false;
      } else {
        console.log("   ❌ Server error:", response.status);
        setError(`Server error: ${response.status}`);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err: any) {
      console.error("   💥 Error verifying token:", err.message);
      setError(err.message);
      setIsAuthenticated(false);
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
          console.log("   → Auth check PASSED ✅");
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          console.log("   → Auth check FAILED ❌");

          // 🔴 PENTING: Jangan otomatis hapus token
          // Biarkan user tetap punya token di localStorage
          // User harus klik logout untuk menghapusnya

          if (retryCount < 1) {
            console.log("   → Retrying in 2 seconds...");
            setTimeout(() => checkAuth(retryCount + 1), 2000);
            return;
          }

          // Setelah retry gagal, set sebagai not authenticated
          // TAPI JANGAN HAPUS TOKEN
          console.log(
            "   → Token is not valid, but keeping it in localStorage",
          );
          console.log("   → User can logout manually to clear it");
          setIsAuthenticated(false);
          setUser(null);
          // ✅ Jangan hapus token di sini: localStorage.removeItem('auth_token');
          setLoading(false);
        }
      } catch (err: any) {
        console.error("💥 [useAuth] Error:", err.message);
        setError(err.message);
        setIsAuthenticated(false);
        setLoading(false);
        // ✅ Jangan hapus token di sini
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

  // 🔴 HANYA LOGOUT yang hapus token
  const logout = async () => {
    try {
      console.log("🚪 [useAuth] Logging out...");

      // Hubungi backend logout endpoint
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      }).catch((err) => {
        console.log("   (Backend logout endpoint optional)");
      });

      // 🔴 BARU HAPUS TOKEN SETELAH KLIK LOGOUT
      console.log("   Clearing localStorage...");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");

      // Reset state
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setLoading(false);

      console.log("   ✅ Logout successful - token cleared");
    } catch (err: any) {
      console.error("   ❌ Logout error:", err.message);
      // Tetap clear token meskipun ada error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Manual refetch untuk re-verify token
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
