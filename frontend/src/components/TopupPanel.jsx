import React, { useState } from "react";
import ApiService from "../services/api";

export default function TopupPanel({ onSuccess, onCancel }) {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser"));
      if (!userData) {
        onCancel?.();
        return;
      }

      await ApiService.topupBalance(userData.id, amount);

      const updatedUser = await ApiService.getClient(userData.id);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setSubmitted(true);
      onSuccess?.({ amount });
    } catch (err) {
      setError("Topup failed. Please try again.");
    }
  };

  return (
    <div>
      {!submitted ? (
        <>
          <h2>Top Up</h2>
          {error && <div className="text-danger mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
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
            Topped up <strong>R{amount}</strong> to your account.
          </p>
          <button onClick={() => onCancel?.()}>Close</button>
        </div>
      )}
    </div>
  );
}
