import React from "react";
import { Box, TextField, InputAdornment } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";

const NumberedTextField = ({
  number,
  name,
  placeholder,
  value,
  onChange,
  icon,
}) => {
  const getIcon = () => {
    switch (icon) {
      case "person":
        return <PersonIcon sx={{ color: "#777" }} />;
      case "email":
        return <EmailIcon sx={{ color: "#777" }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        fullWidth
        name={name}
        placeholder={placeholder}
        variant="outlined"
        value={value}
        onChange={onChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">{getIcon()}</InputAdornment>
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

export default NumberedTextField;
