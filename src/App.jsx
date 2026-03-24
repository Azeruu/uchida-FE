import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import TestPage from "./pages/TestPage";
// import Coba from "./pages/coba";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={
        <ProtectedRoute>
          <TestPage />
        </ProtectedRoute>
      } />
      {/* <Route path="/coba"  element={<Coba/>}/> */}

      {/* Protected routes */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
