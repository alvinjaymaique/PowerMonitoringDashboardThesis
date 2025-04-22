import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";

const SignupPage = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    // Perform signup logic here
    // On successful signup, navigate to PowerReadings
    navigate("/power-readings");
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2 className="title">Sign Up</h2>
        <div className="input-group">
          <label className="label">Name:</label>
          <div className="input-wrapper">
            <input type="text" placeholder="Enter your name" className="input" />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Email:</label>
          <div className="input-wrapper">
            <input type="text" placeholder="Enter your email" className="input" />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Password:</label>
          <div className="input-wrapper">
            <input type="password" placeholder="Enter your password" className="input" />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Confirm Password:</label>
          <div className="input-wrapper">
            <input type="password" placeholder="Confirm your password" className="input" />
          </div>
        </div>
        <button className="sign-in-button" onClick={handleSignup}>Sign Up</button>
        <p className="signup-text">
          Already have an account? <a href="#" className="signup-link">Login here!</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;