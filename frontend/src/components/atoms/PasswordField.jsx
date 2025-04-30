import React from "react";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const PasswordField = ({
  number,
  name,
  placeholder,
  value,
  onChange,
  showPassword,
  toggleVisibility,
}) => {
  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        fullWidth
        name={name}
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
        variant="outlined"
        value={value}
        onChange={onChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon sx={{ color: "#777" }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={toggleVisibility} edge="end">
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            bgcolor: "#e8e8e8",
            borderRadius: "4px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
          },
        }}
      />
    </Box>
  );
};

export default PasswordField;
