// hooks/useAuth.ts - HYBRID APPROACH (localStorage + fallback)
import { useState, useEffect } from "react";
import config from "../config";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("\n🔍 [useAuth] Checking authentication...");

      // 1. Cek localStorage dulu
      const storedToken = localStorage.getItem("auth_token");
      console.log(
        `   localStorage.auth_token: ${storedToken ? "✅ Found" : "❌ Not found"}`,
      );

      if (!storedToken) {
        console.log(`   → No token, user not authenticated`);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // 2. Verify token dengan server
      console.log(`   → Verifying token with server...`);
      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`, // 🔴 Send token di header
        },
        credentials: "include",
      });

      console.log(`   /me status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Token valid`);
        console.log(`   👤 User: ${data.user?.email}`);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log(`   ❌ Token invalid (${response.status})`);
        setUser(null);
        setIsAuthenticated(false);
        // Jangan hapus token, biarkan tetap di localStorage
      }
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("\n🚪 [useAuth] Logout initiated");

      // Call backend logout endpoint (optional)
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        credentials: "include",
      }).catch(() => {});

      // Clear storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");

      setIsAuthenticated(false);
      setUser(null);

      console.log("   ✅ Logged out");
    } catch (err: any) {
      console.error("   ❌ Logout error:", err.message);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const refetch = async () => {
    console.log("🔄 [useAuth] Manual refetch triggered");
    setLoading(true);
    checkAuth();
  };

  return {
    isAuthenticated,
    user,
    loading,
    logout,
    refetch,
  };
};
