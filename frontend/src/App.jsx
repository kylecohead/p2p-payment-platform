import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Topup from "./pages/Topup";
import Send from "./pages/Send";
import Layout from './components/Layout';
import './App.css'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      {/* Authenticated shell */}
      <Route element={<Layout />}> 
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/topup" element={<Topup />} />
        <Route path="/send" element={<Send />} />
      </Route>
    </Routes>
  )
}

export default App
