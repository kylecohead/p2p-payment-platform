import React from "react";
import "./Restricted.css";

export default function Restricted() {
  return (
    <div className="restricted-container">
      <h1 className="restricted-title">Access Denied</h1>
      <p className="restricted-message">You do not have permission to view this page.</p>
    </div>
  );
}