import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/api";
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await ApiService.login(email, password);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      navigate('/home');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name")?.toString().trim();
    const rawEmail = form.get("email")?.toString().trim();
    const phone = form.get("phone")?.toString().trim();
    const pwd = form.get("password")?.toString();
    const confirm = form.get("confirmPassword")?.toString();

    // Client-side validation
    if (!name || !rawEmail || !phone || !pwd || !confirm) {
      return setError("Please fill in all fields.");
    }
    if (pwd !== confirm) {
      return setError("Passwords do not match.");
    }
    if (pwd.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    try {
      const userData = await ApiService.signup(name, email, phone, password);

      localStorage.setItem("currentUser", JSON.stringify(userData));
      navigate("/home");
    } catch (err) {
      const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Signup failed. Please try again.";

      setError(msg);
    }
  };


  return (
      <div className="login-page">
        <div className="login-card">
          <h2>{isLogin ? "Login" : "Sign Up"}</h2>
          {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          {isLogin ? (
              <form onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="form-text">Email</label>
                  <input
                      type="email"
                      id="email"
                      name="email"
                      className="input-box"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="form-text">Password</label>
                  <input
                      type="password"
                      id="password"
                      name="password"
                      className="input-box"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                  />
                </div>
                <button type="submit" className="submit-button">Login</button>
              </form>
          ) : (
              <form onSubmit={handleSignup}>
                <div>
                  <label htmlFor="new-name" className="form-text">Name</label>
                  <input type="text" id="new-name" name="name" className="input-box" required autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="new-email" className="form-text">Email</label>
                  <input type="email" id="new-email" name="email" className="input-box" required autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="new-phone" className="form-text">Phone Number</label>
                  <input type="tel" id="new-phone" name="phone" className="input-box" required autoComplete="tel" />
                </div>
                <div>
                  <label htmlFor="new-password" className="form-text">Password</label>
                  <input type="password" id="new-password" name="password" className="input-box" required autoComplete="new-password" />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="form-text">Confirm Password</label>
                  <input type="password" id="confirm-password" name="confirmPassword" className="input-box" required autoComplete="new-password" />
                </div>
                <button type="submit" className="submit-button">Sign Up</button>
              </form>
          )}
          <p>
            {isLogin ? (
                <>Don't have an account? <button type="button" className="switch-button" onClick={() => setIsLogin(false)}>Sign Up</button></>
            ) : (
                <>Already have an account? <button type="button" className="switch-button" onClick={() => setIsLogin(true)}>Login</button></>
            )}
          </p>
        </div>
      </div>
  );

}