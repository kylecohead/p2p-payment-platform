import React from "react";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-message">The page you are looking for does not exist.</p>
    </div>
  );
}