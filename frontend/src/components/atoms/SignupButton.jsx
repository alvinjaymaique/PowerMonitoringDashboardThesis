import React from "react";
import { Box, Button } from "@mui/material";

const SignupButton = ({ number, onClick }) => {
  return (
    <Box sx={{ position: "relative", mt: 1 }}>
      <Button
        fullWidth
        variant="contained"
        onClick={onClick}
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
        Sign Up
      </Button>
    </Box>
  );
};

export default SignupButton;
