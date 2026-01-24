import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import config from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('📡 Sending login request to:', `${config.apiUrl}/login`);
      console.log('🌍 Current origin:', window.location.origin);

      const response = await fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // PENTING: kirim cookies + credentials
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', {
        'content-type': response.headers.get('content-type'),
        'set-cookie': response.headers.get('set-cookie'),
      });

      const data = await response.json();
      console.log('📦 Response data:', {
        success: data.success,
        hasToken: !!data.token,
        hasUser: !!data.user,
      });

      if (response.ok && data.success) {
        console.log('✅ Login successful');

        // Simpan token di localStorage (fallback jika cookie tidak bekerja)
        if (data.token) {
          console.log('💾 Saving token to localStorage');
          localStorage.setItem('auth_token', data.token);
        }

        // Simpan user info
        if (data.user) {
          console.log('💾 Saving user to localStorage');
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        toast.success('Login berhasil! Mengalihkan...');

        // Tunggu cookie diterima + localStorage tersimpan
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 500);
      } else {
        const errorMsg = data.message || 'Login gagal';
        console.error('❌ Login failed:', errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      const errorMsg = err.message || 'Terjadi kesalahan saat login';
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
          <p className="text-indigo-100 text-sm mt-2">Admin Dashboard Uchida Test</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Guest Button */}
        <button
          onClick={() => navigate('/test')}
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
                type={showPassword ? 'text' : 'password'}
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-white/80 text-xs font-semibold mb-2">📝 Demo Credentials:</p>
          <div className="space-y-1 text-white/60 text-xs font-mono">
            <p>
              Email: <span className="text-cyan-300">admin.kim@gmail.com</span>
            </p>
            <p>
              Password: <span className="text-cyan-300">kimkantor1</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          Uchida Test Platform © 2026 | Secure Authentication
        </p>
      </div>
    </div>
  );
}