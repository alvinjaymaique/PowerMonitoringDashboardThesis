import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "css/LoginPage.css";

// Import Material UI components
import { Box, Container, Typography, Button } from "@mui/material";

// Import custom components from signup page
import NumberedTextField from "components/atoms/NumberedTextField";
import PasswordField from "components/atoms/PasswordField";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = () => {
    // Perform login logic here
    // On successful login, navigate to dashboard
    navigate("/dashboard");
  };

  const handleSignupRedirect = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            Login
          </Typography>

          {/* Email field using NumberedTextField from signup */}
          <NumberedTextField
            name="email"
            placeholder="USERNAME / EMAIL:"
            value={formData.email}
            onChange={handleChange}
            icon="email"
          />

          {/* Password field using PasswordField from signup */}
          <PasswordField
            name="password"
            placeholder="PASSWORD:"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            toggleVisibility={togglePasswordVisibility}
          />

          {/* Login button */}
          <Box sx={{ position: "relative", mt: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{
                mt: 1,
                bgcolor: "rgba(255, 255, 255, 0.3)",
                color: "white",
                py: 1,
                boxShadow: "none",
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "none",
                },
              }}
            >
              Sign In
            </Button>
          </Box>

          {/* Signup redirect link */}
          <Typography
            variant="body2"
            sx={{
              color: "white",
              textAlign: "center",
              mt: 2,
            }}
          >
            Don't have an account?{" "}
            <Box
              component="a"
              href="#"
              onClick={handleSignupRedirect}
              sx={{
                color: "white",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
            >
              Sign up here!
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
