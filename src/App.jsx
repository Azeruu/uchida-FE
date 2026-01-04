import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/HomePage";
import Login from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import TestPage from "./pages/TestPage";
// import Coba from "./pages/coba";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/test" element={<TestPage />} />
      {/* <Route path="/coba"  element={<Coba/>}/> */}

      {/* Protected routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
