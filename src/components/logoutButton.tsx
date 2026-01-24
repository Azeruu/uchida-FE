import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Confirm logout
    if (!confirm("Apakah Anda yakin ingin logout?")) {
      return;
    }

    setIsLoggingOut(true);

    try {
      console.log("🚪 User initiated logout");

      // Call logout dari useAuth hook
      // Ini akan handle:
      // 1. Call backend /logout endpoint
      // 2. Clear localStorage
      // 3. Reset auth state
      await logout();

      console.log("✅ Logout completed");

      // Redirect ke login page
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Tetap redirect meskipun ada error
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
    >
      <LogOut className="w-4 h-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
