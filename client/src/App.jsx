import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import AdminSignup from "./pages/AdminSignup.jsx";
import ApiTest from "./pages/ApiTest.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/test" element={<ApiTest />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
