import React, { useState } from "react";
import './Home.css';
import {useNavigate} from "react-router-dom";

export default function Home() {
   const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/Login'); 
  };
  const handleSend = () => {
    navigate('/Send');
  };
  const handleTopup = () => {
    navigate('/Topup');
  };

  return (
       <div className="home">
         <h2>Home</h2>
         <div className="account">
            <span className="account-info">Logged in as: </span>
         </div>
         
         <div className="balance-section">
           <span>Your Balance:</span>
         </div>
         
         <div className="button-section">
         <button onClick={handleSend}>Send </button>
         <button onClick={handleTopup}>Topup</button>
         </div> 
         <div className="logout-button">
         <button onClick={handleLogout}>Logout</button>
         </div>

        </div>    
  );
}
