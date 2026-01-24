import { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
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
      console.log("\n🔐 [LOGIN] Submitting...");
      console.log(`   Email: ${email}`);

      // Post login
      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔴 PENTING! Include cookies
        body: JSON.stringify({ email, password }),
      });

      console.log(`   Response status: ${response.status}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log(`   ✅ Login successful`);
      console.log(`   🍪 Cookie set by server`);

      // Save token to localStorage as backup
      if (data.token) {
        console.log(`   💾 Saving token to localStorage`);
        localStorage.setItem("auth_token", data.token);
      }

      // Save user info
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Wait untuk cookie settle
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate ke admin
      console.log(`   🚀 Navigating to /admin`);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Uchida Test</h1>
          <p className="text-indigo-100 text-sm mt-2">Admin Dashboard</p>
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
          🎯 Test as Guest
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
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/60"
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
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/60 pr-10"
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
            {loading ? "Logging in..." : "Login Admin"}
          </button>
        </form>

        {/* Demo Creds */}
        <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60">
          <p className="font-semibold mb-1">📝 Demo:</p>
          <p>Email: admin.kim@gmail.com</p>
          <p>Password: kimkantor1</p>
        </div>
      </div>
    </div>
  );
}
