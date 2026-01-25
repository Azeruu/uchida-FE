import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Notebook, MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function Login() {
  const [email, setEmail] = useState("admin.kim@gmail.com");
  const [password, setPassword] = useState("kimkantor1");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Post login
      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔴 PENTING! Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token to localStorage as backup
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      // Save user info
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Wait untuk cookie settle
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate ke admin
      navigate("/admin", { replace: true });
    } catch (err: any) {
      const errorMsg = err.message || "Login failed";
      console.error(`   ❌ Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-backgroun/40 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex justify-between items-center p-2">
        <button
          onClick={() => (window.location.href = "/")}
          className="text-(--text1) w-35 border border-(--border1)/40 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-(--hover1)/30 font-medium"
        >
          ← Kembali ke Menu
        </button>
        <button
          onClick={() => (window.location.href = "/test")}
          className="text-(--text2) w-auto border border-(--border2)/40 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-(--hover2)/30 font-medium"
        >
          Test Sebagai Guest →
        </button>
      </div>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-transparent border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Notebook className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Uchida Test</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Guest Button */}
        <button
          onClick={() => navigate("/test")}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg mb-4"
        >
          🎯 Mulai Test Sebagai Guest (Tamu)
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/10 text-white/60">atau</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-(--text1) placeholder-white/50 focus:outline-none focus:border-white/60"
              required
              disabled={loading}
            />
          </div>

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
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-(--text1) placeholder-white/50 focus:outline-none focus:border-white/60 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
              >
                {showPassword ? (
                  <EyeOff className="w5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-500 text-white font-bold py-3 rounded-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Demo Creds */}
        {/* <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60">
              
        </div> */}
      </div>
    </div>
  );
}
