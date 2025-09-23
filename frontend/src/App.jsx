import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Topup from "./pages/Topup";
import Send from "./pages/Send";
import Payments from './pages/Payments';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import Popup from './components/Popup';
import NotFound from "./pages/NotFound";
import './App.css'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<LandingPage />} />
      {/* Page not found */}
      <Route path="*" element={<NotFound />} />
      {/* Authenticated shell */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topup" element={<Topup />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/send" element={<Send />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
