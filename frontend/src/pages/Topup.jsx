import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Topup.css";

export default function Topup() {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleCancel = () => {
    setAmount("");
    navigate("/home");
  };

  const handleReturnHome = () => {
    navigate("/home");
  };

  return (
    <div className="topup-container">
      {!submitted ? (
        <>
          <h2>Top Up</h2>
          <form className="topup-form" onSubmit={handleSubmit}>
            <div>
              <label>Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <button type="submit">Submit</button>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </form>
        </>
      ) : ( // after submit, give confirmation message and option to return home
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
