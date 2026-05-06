import { Routes, Route, Navigate, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-bgDark text-gray-100">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-safe">MineGuard</span>
          <span className="text-xs text-gray-400">AI Rockfall Prediction</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/dashboard" className="hover:text-safe">Live Dashboard</Link>
          <Link to="/admin" className="hover:text-safe">Admin</Link>
          <Link to="/login" className="border border-safe px-3 py-1 rounded hover:bg-safe hover:text-bgDark">
            Login
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
