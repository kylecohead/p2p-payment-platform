import React, { useState, useEffect } from "react";
import './Home.css';
import {useNavigate} from "react-router-dom";
import ApiService from "../services/api";

export default function Home() {
   const navigate = useNavigate();
   const [user, setUser] = useState(null);
   const [balance, setBalance] = useState(0);

   useEffect(() => {
     const userData = localStorage.getItem('currentUser');
     if (!userData) {
       navigate('/login');
       return;
     }
     
     const parsedUser = JSON.parse(userData);
     setUser(parsedUser);
     setBalance(parsedUser.balance);
   }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login'); 
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
            <span className="account-info">Logged in as: {user?.name || 'Loading...'}</span>
         </div>
         
         <div className="balance-section">
           <span>Your Balance: ${balance?.toFixed(2) || '0.00'}</span>
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
