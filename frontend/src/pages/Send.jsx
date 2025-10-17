import { useState } from "react";
import "./Send.css";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/api";

export default function Send() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
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

      await ApiService.sendMoney(
        userData.id,
        amount,
        recipientEmail,
        description
      );

      // Update user data in localStorage
      const updatedUser = await ApiService.getClient(userData.id);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Send failed. Please try again.");
    }
  };

  const handleCancel = () => {
    setRecipientEmail("");
    setAmount("");
    setDescription("");
    navigate("/dashboard");
  };

  const handleReturnHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="send-container">
      {!submitted ? (
        <>
          <h2>Send Money</h2>
          {error && <div className="text-danger mb-4">{error}</div>}
          <form className="send-form" onSubmit={handleSubmit}>
            <div>
              <label>Recipient Email:</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>
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
            <div>
              <label>Description:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this payment for?"
              />
            </div>
            <button type="submit">Submit</button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </form>
        </>
      ) : (
        // After valid submitted send, show confirmation message
        <div style={{ textAlign: "center" }}>
          <h2>Success!</h2>
          <p>
            Sent <strong>R{amount}</strong> to <strong>{recipientEmail}</strong>
            .
          </p>
          <button onClick={handleReturnHome}>Return to Home</button>
        </div>
      )}
    </div>
  );
}
