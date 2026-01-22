import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log("🔄 Sending login request to:", `${config.apiUrl}/login`);
    console.log("📤 Request body:", { email, password });

    const response = await fetch(`${config.apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    console.log("📡 Response status:", response.status);
    console.log(
      "📡 Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    const data = await response.json();
    console.log("📦 Response data:", data);

    if (response.ok && data.success) {
      console.log("✅ Login successful");

      // CRITICAL: Cek apakah token ada di response
      if (data.token) {
        console.log(
          "💾 Saving token to localStorage:",
          data.token.substring(0, 20) + "...",
        );
        localStorage.setItem("auth_token", data.token);

        // Verify token tersimpan
        const savedToken = localStorage.getItem("auth_token");
        console.log(
          "✔️ Token verified in localStorage:",
          savedToken ? "YES" : "NO",
        );
      } else {
        console.error("❌ NO TOKEN in response data!");
      }

      if (data.user) {
        console.log("💾 Saving user to localStorage:", data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      toast.success("Login berhasil!");

      // Delay sedikit sebelum navigate untuk memastikan localStorage tersimpan
      setTimeout(() => {
        navigate("/admin");
      }, 100);
    } else {
      console.error("❌ Login failed:", data.message);
      toast.error(data.message || "Login gagal");
    }
  } catch (error) {
    console.error("💥 Login error:", error);
    toast.error("Terjadi kesalahan saat login");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white/10 rounded-lg shadow-lg p-8 w-full max-w-md md:max-w-4xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16  bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-(--text1)">Selamat Datang</h1>
          <p className="text-(--aksen1) text-xs mt-2">
            Pilih akses yang diinginkan
          </p>
        </div>

        {/* Guest Access Button */}
        <div className="mb-6">
          <button
            onClick={() => (window.location.href = "/test")}
            className="w-full bg-(--button1) hover:bg-(--hover1) text-white font-bold py-3 rounded-lg transition mb-4"
          >
            Mulai Test sebagai Guest
          </button>
        </div>

        {/* Admin Login Form */}
        <div className="border-t pt-3 border-indigo-300/50">
          <h3 className="text-xl  font-semibold text-(--aksen1) mb-4 text-center">
            Login Admin
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-(--text1) mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-4 py-3 border-2 border-(--border1) rounded-lg focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text1) mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="**********"
                  className="w-full px-4 py-3 border-2 border-(--border1) rounded-lg focus:border-indigo-500 focus:outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-(--button1) hover:bg-(--hover1) disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? "Memproses..." : "Login Admin"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Kredensial admin:</p>
            <p>
              <strong>Email:</strong> admin.kim@gmail.com
            </p>
            <p>
              <strong>Password:</strong> kimkantor1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
