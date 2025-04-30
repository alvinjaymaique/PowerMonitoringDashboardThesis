import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "css/LoginPage.css";

// Import Material UI components
import { Box, Container, Typography } from "@mui/material";

// Import custom components
import NumberedTextField from "components/atoms/NumberedTextField";
import PasswordField from "components/atoms/PasswordField";
import SignupButton from "components/atoms/SignupButton";
import LoginRedirect from "components/atoms/LoginRedirect";

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = () => {
    // Perform signup logic here
    // On successful signup, navigate to PowerReadings
    navigate("/power-readings");
  };

  const handleLoginRedirect = (e) => {
    e.preventDefault();
    navigate("/");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#c8f5c8",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2357855c' fill-opacity='0.3' d='M0,128L80,160C160,192,320,256,480,240C640,224,800,128,960,96C1120,64,1280,96,1360,112L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "cover",
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            bgcolor: "#57855c",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "white",
              fontWeight: 500,
              mb: 2,
              textAlign: "center",
            }}
          >
            Register
          </Typography>

          {/* Name field */}
          <NumberedTextField
            name="name"
            placeholder="NAME:"
            value={formData.name}
            onChange={handleChange}
            icon="person"
          />

          {/* Email field */}
          <NumberedTextField
            name="email"
            placeholder="USERNAME / EMAIL:"
            value={formData.email}
            onChange={handleChange}
            icon="email"
          />

          {/* Password field */}
          <PasswordField
            name="password"
            placeholder="PASSWORD:"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleVisibility={togglePasswordVisibility}
          />

          {/* Confirm Password field */}
          <PasswordField
            name="confirmPassword"
            placeholder="CONFIRM PASSWORD:"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            toggleVisibility={toggleConfirmPasswordVisibility}
          />

          {/* Sign Up button */}
          <SignupButton onClick={handleSignup} />

          {/* Login redirect link */}
          <LoginRedirect onClick={handleLoginRedirect} />
        </Box>
      </Container>
    </Box>
  );
};

export default SignupPage;
