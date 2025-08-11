import { useState } from "react";
import { Link } from "react-router-dom";
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        {isLogin ? (
          <form>
            <div>
              <label htmlFor="username" className="form-text">Username</label>
              <input type="text" id="username" name="username" className="input-box" required />
            </div>
            <div>
              <label htmlFor="password" className="form-text">Password</label>
              <input type="password" id="password" name="password" className="input-box" required  />
            </div>
            <Link to="/home">
              <button type="submit" className="submit-button">Login</button>
            </Link>
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
            <Link to="/home">
              <button type="submit" className="submit-button">Sign Up</button>
            </Link>
            
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