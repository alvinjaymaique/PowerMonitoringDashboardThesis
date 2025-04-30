import React from "react";
import { Typography, Box } from "@mui/material";

const LoginRedirect = ({ onClick }) => {
  return (
    <Typography
      variant="body2"
      sx={{
        color: "white",
        textAlign: "center",
        mt: 2,
      }}
    >
      Already have an account?{" "}
      <Box
        component="a"
        href="#"
        onClick={onClick}
        sx={{
          color: "white",
          fontWeight: "bold",
          textDecoration: "underline",
        }}
      >
        Login here!
      </Box>
    </Typography>
  );
};

export default LoginRedirect;
