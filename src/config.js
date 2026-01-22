const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
};

console.log("🔧 Config loaded:", config); // Debug

export default config;

// const config = {
//   // Deteksi environment otomatis
//   apiUrl:
//     import.meta.env.VITE_API_URL ||
//     (window.location.hostname === "localhost"
//       ? "http://localhost:8080/api"
//       : "https://https://uchida-be.onrender.com/api"), // Ganti dengan backend production URL
// };

// export default config;
