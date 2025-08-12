import { useState } from "react";
import "./Send.css";
import { useNavigate } from "react-router-dom";

export default function Send() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleCancel = () => {
    setAccount("");
    setAmount("");
    navigate("/home");
  };

  const handleReturnHome = () => {
    navigate("/home");
  };

  return (
    <div className="send-container">
      {!submitted ? (
        <>
          <h2>Send Money</h2>
          <form className="send-form" onSubmit={handleSubmit}>
            <div>
              <label>Account Number:</label>
              <input
                type="text"
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
              />
            </div>
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
      ) : ( // After valid submitted send, show confirmation message
        <div style={{ textAlign: "center" }}>
          <h2>Success!</h2>
          <p>
            Sent <strong>R{amount}</strong> to account <strong>{account}</strong>.
          </p>
          <button onClick={handleReturnHome}>Return to Home</button>
        </div>
      )}
    </div>
  );
}
