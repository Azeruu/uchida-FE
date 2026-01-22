import * as React from "react";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import config from "../config";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🌐 Current hostname:", window.location.hostname);
        console.log("🔧 API URL from config:", config.apiUrl);
        console.log("🔍 Checking authentication...");

        const token = localStorage.getItem("auth_token");

        if (!token) {
          console.log("❌ No token found in localStorage");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log("✅ Token found:", token.substring(0, 20) + "...");

        const apiUrl = `${config.apiUrl}/me`;
        console.log("📡 Calling API:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log("📡 Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("📦 Response data:", data);

          if (data.success && data.user?.role === "admin") {
            console.log("✅ User authenticated as admin");
            setIsAuthenticated(true);
          } else {
            console.log("❌ User not admin or invalid response");
            setIsAuthenticated(false);
            // HANYA hapus token jika response OK tapi data invalid
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
          }
        } else {
          console.log("❌ Response not OK:", response.status);

          // Jika 401, kemungkinan token expired atau invalid
          if (response.status === 401) {
            console.log("⚠️ Token might be expired or invalid");
            // JANGAN langsung hapus, beri kesempatan user untuk re-login
          }

          setIsAuthenticated(false);
          // JANGAN hapus token di sini! Biarkan user coba login lagi
          // localStorage.removeItem('auth_token'); // ← KOMEN INI
          // localStorage.removeItem('user');
        }
      } catch (error) {
        console.error("❌ Auth check failed:", error);
        setIsAuthenticated(false);
        // JANGAN hapus token saat network error
        // localStorage.removeItem('auth_token'); // ← KOMEN INI
        // localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
