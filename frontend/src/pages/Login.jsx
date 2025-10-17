import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ApiService from "../services/api";
import SafePayBot from "../components/TurtleMascot";
import "./Login.css";
import ShadowLeft from "../assets/ShadowLeft.png";
import ShadowRight from "../assets/ShadowRight.png";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if we should show signup form based on URL parameter
  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const rawEmail = email?.trim();
    const pwd = password ?? "";

    // Client-side validation
    if (!rawEmail || !pwd) {
      return setError("Please fill in all fields.");
    }
    if (!validateEmail(rawEmail)) {
      return setError("Please enter a valid email address.");
    }
    if (!validatePassword(pwd)) {
      return setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
    }
    try {
      const userData = await ApiService.login(email, password);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      
      if (userData.admin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
    } catch (err) {
      setError("Sign in failed. Please check your credentials.");
    }
  };

  // Validate and handle signup requests
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
    if (!validateName(name)) {
      return setError("Name must be at least 2 characters.");
    }
    if (!validateEmail(rawEmail)) {
      return setError("Please enter a valid email address.");
    }
    if (!validatePhone(phone)) {
      return setError("Please enter a valid phone number.");
    }
    if (!validatePassword(pwd)) {
      return setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
    }
    if (!validateConfirmPassword(pwd, confirm)) {
      return setError("Passwords do not match.");
    }

    try {
      const userData = await ApiService.signup(name, rawEmail, phone, pwd);

      localStorage.setItem("currentUser", JSON.stringify(userData));
      navigate("/dashboard");
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
      <main className="login-page-content">
        <div className="login-card">
          <h2>{isLogin ? "Sign in" : "Sign Up"}</h2>

          {/* SafePay Bot Mascot - only show on login form */}
          {isLogin && (
            <SafePayBot
              isPasswordFocused={isPasswordFocused}
              showPassword={showPassword}
            />
          )}

          {error && <div className="text-danger mb-4">{error}</div>}
          {isLogin ? (
            <form onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="form-text">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-box"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="form-text">
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="input-box password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter at least 8 characters"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      // Eye open - password is visible
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      // Eye closed with slash - password is hidden
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="3"
                          y1="3"
                          x2="21"
                          y2="21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="submit-button">
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div>
                <label htmlFor="new-name" className="form-text">
                  Name
                </label>
                <input
                  type="text"
                  id="new-name"
                  name="name"
                  className="input-box"
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="new-email" className="form-text">
                  Email
                </label>
                <input
                  type="email"
                  id="new-email"
                  name="email"
                  className="input-box"
                  required
                  autoComplete="email"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label htmlFor="new-phone" className="form-text">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="new-phone"
                  name="phone"
                  className="input-box"
                  required
                  autoComplete="tel"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="form-text">
                  Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  name="password"
                  className="input-box"
                  required
                  autoComplete="new-password"
                  placeholder="Enter at least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="form-text">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  name="confirmPassword"
                  className="input-box"
                  required
                  autoComplete="new-password"
                  placeholder="Enter at least 8 characters"
                />
              </div>
              <button type="submit" className="submit-button">
                Sign Up
              </button>
            </form>
          )}
          <p className="switch-text">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => setIsLogin(true)}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
      <footer className="login-page-footer">
        <p>&copy; 2025 Waluigi Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
// ----- HELPER FUNCTIONS -----

// Password: min 8 chars, must include upper, lower, number
function validatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUpper && hasLower && hasNumber;
}

// Name: must be at least 2 characters
function validateName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}

// Email: simple regex check
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Phone: digits only, length 10–15 (adjust as needed)
function validatePhone(phone) {
  const re = /^\+?\d{10,15}$/;
  return re.test(phone);
}

// Confirm password: match check
function validateConfirmPassword(password, confirm) {
  return password === confirm;
}
