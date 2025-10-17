import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Topup from "./pages/Topup";
import Send from "./pages/Send";
import Payments from "./pages/Payments";
import Layout from "./components/Layout";
import Admin from "./pages/Admin";
import Beneficiaries from "./pages/Beneficiaries";
import NotFound from "./pages/NotFound";
import { SSEProvider } from "./contexts/SSEContext";
import Restricted from "./pages/Restricted";
import "./App.css";

function App() {
  return (
    <SSEProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LandingPage />} />
        {/* Page not found */}
        <Route path="*" element={<NotFound />} />
        {/* Restricted access */}
        <Route path="/restricted" element={<Restricted />} />

        {/* Authenticated shell */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/topup" element={<Topup />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/send" element={<Send />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
        </Route>
      </Routes>
    </SSEProvider>
  );
}

export default App;
