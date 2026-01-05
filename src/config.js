const config = {
  // Menggunakan relative path '/api' agar request ditangani oleh:
  // 1. Vite Proxy (di Development) -> meneruskan ke localhost:8080
  // 2. Vercel Rewrites (di Production) -> meneruskan ke Render
  // Ini membuat browser menganggap request adalah "First-Party", sehingga cookie tidak diblokir.
  apiUrl: "/api",
};

export default config;
