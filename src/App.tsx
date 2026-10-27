import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./demo/presentation/pages/LoginPage";
import DashboardPage from "./demo/presentation/pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/demo/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
