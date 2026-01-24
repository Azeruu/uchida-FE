import{ useState } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "../config";

export default function Login() {
  const [email, setEmail] = useState("admin.kim@gmail.com");
  const [password, setPassword] = useState("kimkantor1");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get redirect URL dari query parameter
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("📡 1️⃣ Sending login request...");
      console.log("   API URL:", config.apiUrl);
      console.log("   Email:", email);

      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // PENTING: kirim cookies
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 2️⃣ Response received");
      console.log("   Status:", response.status);
      console.log("   Content-Type:", response.headers.get("content-type"));
      console.log("   Set-Cookie:", response.headers.get("set-cookie"));

      const data = await response.json();
      console.log("📡 3️⃣ Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      console.log("✅ 4️⃣ Login successful");

      // PENTING: Simpan token
      if (data.token) {
        console.log("💾 5️⃣ Saving token to localStorage...");
        console.log("   Token preview:", data.token.substring(0, 50) + "...");
        console.log("   Token length:", data.token.length);

        localStorage.setItem("auth_token", data.token);

        // Verify
        const savedToken = localStorage.getItem("auth_token");
        if (savedToken) {
          console.log("✅ 6️⃣ Token saved successfully");
          console.log("   Saved token matches:", savedToken === data.token);
        } else {
          console.error("❌ 6️⃣ Token save failed!");
          throw new Error("Failed to save token to localStorage");
        }
      } else {
        console.error("❌ No token in response!");
        throw new Error("No token received from server");
      }

      // Simpan user info
      if (data.user) {
        console.log("💾 7️⃣ Saving user info...");
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("✅ 8️⃣ All data saved. Ready to navigate.");
      toast.success("Login berhasil! 🎉");

      // Wait a bit untuk localStorage finalize
      setTimeout(() => {
        console.log("🚀 9️⃣ Navigating to", redirectUrl);
        navigate(redirectUrl, { replace: true });
      }, 300);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      const errorMsg = err.message || "Terjadi kesalahan saat login";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main card */}
      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Selamat Datang</h1>
          <p className="text-indigo-100 text-sm mt-2">
            Admin Dashboard Uchida Test
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-200 text-sm font-medium">Login Gagal</p>
              <p className="text-red-200/80 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Guest Button */}
        <button
          onClick={() => navigate("/test")}
          className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition mb-6 shadow-lg"
        >
          🎯 Mulai Test sebagai Guest
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white/60 text-sm">atau</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin.kim@gmail.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/20 transition"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/20 transition pr-12"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Login Admin
              </>
            )}
          </button>
        </form>

        {/* Debug Info - Helpful for troubleshooting */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-white/80 text-xs font-semibold mb-2">
            📝 Demo Credentials:
          </p>
          <div className="space-y-1 text-white/60 text-xs font-mono">
            <p>
              Email: <span className="text-cyan-300">admin.kim@gmail.com</span>
            </p>
            <p>
              Password: <span className="text-cyan-300">kimkantor1</span>
            </p>
          </div>
          <p className="text-white/50 text-xs mt-3 border-t border-white/10 pt-3">
            💡 Tip: Buka DevTools (F12) → Console untuk melihat detail login
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          Uchida Test Platform © 2026 | Secure Authentication
        </p>
      </div>
    </div>
  );
}
