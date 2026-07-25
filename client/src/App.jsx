import { Routes, Route } from "react-router-dom";
import ClientLayout from "./layouts/ClientLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Landing from "./pages/Landing.jsx";
import ClientLogin from "./pages/ClientLogin.jsx";
import ClientSignup from "./pages/ClientSignup.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminSignup from "./pages/AdminSignup.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Health from "./pages/Health.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public & Client Portal Routes */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/signup" element={<ClientSignup />} />
        <Route path="/dashboard" element={<ClientDashboard />} />
        <Route path="/health" element={<Health />} />
      </Route>

      {/* Admin Unprotected Auth Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />

      {/* Admin Protected Dashboard Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}
