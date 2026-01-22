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
      console.log("Checking auth...");

      // Ambil token dari localStorage sebagai fallback
      const localToken = localStorage.getItem("auth_token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Jika ada token di localStorage, kirim via Authorization header
      if (localToken) {
        headers["Authorization"] = `Bearer ${localToken}`;
      }

      const response = await fetch(`${config.apiUrl}/me`, {
        method: "GET",
        credentials: "include", // Tetap kirim cookie jika ada
        headers,
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);

        if (data.success && data.user?.role === "admin") {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("auth_token"); // Clear invalid token
        }
      } else {
        console.log("Response not OK");
        setIsAuthenticated(false);
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, []);

  // Loading state
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

  // Redirect jika tidak terautentikasi
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
