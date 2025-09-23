import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/api";
import "./Topup.css";

export default function Topup() {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser"));
      if (!userData) {
        navigate("/dashboard");
        return;
      }

      await ApiService.topupBalance(userData.id, amount);

      // Update user data in localStorage
      const updatedUser = await ApiService.getClient(userData.id);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setSubmitted(true);
    } catch (err) {
      setError("Topup failed. Please try again.");
    }
  };

  const handleCancel = () => {
    setAmount("");
    navigate("/dashboard");
  };

  const handleReturnHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="topup-container">
      {!submitted ? (
        <>
          <h2>Top Up</h2>
          {error && (
            <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
          )}
          <form className="topup-form" onSubmit={handleSubmit}>
            <div>
              <label>Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <button type="submit">Submit</button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </form>
        </>
      ) : (
        // after submit, give confirmation message and option to return home
        <div style={{ textAlign: "center" }}>
          <h2>Success!</h2>
          <p>
            Topped up <strong>R{amount}</strong> to your account.
          </p>
          <button onClick={handleReturnHome}>Return to Home</button>
        </div>
      )}
    </div>
  );
}
