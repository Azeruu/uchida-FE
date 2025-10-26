const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (window.location.hostname === "localhost"
      ? "http://localhost:8080/api"
      : "https://uchida-be.onrender.com/api"),
};

export default config;