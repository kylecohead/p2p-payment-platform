import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Topup from "./pages/Topup";
import Send from "./pages/Send";
import Payments from './pages/Payments';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import './App.css'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      {/* Authenticated shell */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
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
