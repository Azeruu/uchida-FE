// hooks/useAuth.ts - SIMPLIFIED & CORS-FRIENDLY
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

      // Log cookies
      console.log(`   Cookies: ${document.cookie || "(empty)"}`);

      // Call /me endpoint
      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        credentials: "include", // 🔴 PENTING! Include cookies
      });

      console.log(`   /me status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Authenticated as: ${data.user?.email}`);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log(`   ❌ Not authenticated (${response.status})`);
        setUser(null);
        setIsAuthenticated(false);
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

      // Call logout endpoint
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});

      // Clear storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");

      setIsAuthenticated(false);
      setUser(null);

      console.log("   ✅ Logged out");
    } catch (err) {
      console.error("   ❌ Logout error:", err);
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    logout,
    refetch: checkAuth,
  };
};
