import React, { useState } from "react";
import ApiService from "../services/api";

export default function SendPanel({
  onSuccess,
  onCancel,
  recipientEmail: initialRecipientEmail = "",
}) {
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    setRecipientEmail(initialRecipientEmail);
  }, [initialRecipientEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser"));
      if (!userData) {
        onCancel?.();
        return;
      }

      console.log("SendPanel: Sending money...", { amount, recipientEmail, description });
      
      // Send the money
      const result = await ApiService.sendMoney(
        userData.id,
        amount,
        recipientEmail,
        description
      );

      console.log("SendPanel: Payment successful", result);

      // Update local user data with fresh information
      const updatedUser = await ApiService.getClient(userData.id);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // Small delay to allow backend SSE notifications to be sent
      setTimeout(() => {
        setSubmitted(true);
        onSuccess?.({ amount, recipientEmail, result });
      }, 100);
    } catch (err) {
      console.error("SendPanel: Payment failed", err);
      setError(err.message || "Send failed. Please try again.");
    }
  };

  return (
    <div>
      {!submitted ? (
        <>
          <h2>Send Money</h2>
          {error && <div className="text-danger mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
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
            <div className="row mt-4">
              <button className="btn" type="submit">
                Submit
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => onCancel?.()}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <h2>Success!</h2>
          <p>
            Sent <strong>R{amount}</strong> to <strong>{recipientEmail}</strong>
            .
          </p>
          <button onClick={() => onCancel?.()}>Close</button>
        </div>
      )}
    </div>
  );
}
