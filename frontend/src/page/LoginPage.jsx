import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Perform login logic here
    // On successful login, navigate to PowerReadings
    navigate("/dashboard");
  };

  const handleSignupRedirect = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2 className="title">Login</h2>
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
        <button className="sign-in-button" onClick={handleLogin}>Sign In</button>
        <p className="signup-text">
          Don't have an account? <a href="#" className="signup-link" onClick={handleSignupRedirect}>Sign up here!</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;