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
              />
            </div>
            <button type="submit" className="submit-button">Login</button>
          </form>
        ) : (
          <form>
            <div>
              <label htmlFor="new-username" className="form-text">Username</label>
              <input type="text" id="new-username" name="username" className="input-box" required />
            </div>
            <div>
              <label htmlFor="new-password" className="form-text">Password</label>
              <input type="password" id="new-password" name="password" className="input-box" required />
            </div>
            <div>
              <label htmlFor="confirm-password" className="form-text">Confirm Password</label>
              <input type="password" id="confirm-password" name="confirmPassword" className="input-box" required />
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