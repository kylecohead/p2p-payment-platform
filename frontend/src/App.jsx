import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Topup from "./pages/Topup";
import Send from "./pages/Send";
import './App.css'

function App() {
  return (
    <div>
      

      {/* Page Routes */}
      <Routes>
        <Route path="/" element={
          <nav>
            <Link to="/home">Home</Link> |{" "}
            <Link to="/login">Login</Link> |{" "}
            <Link to="/topup">Topup</Link> |{" "}
            <Link to="/send">Send</Link>
          </nav>} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/topup" element={<Topup />} />
        <Route path="/send" element={<Send />} />
      </Routes>
    </div>
  )
}

export default App
