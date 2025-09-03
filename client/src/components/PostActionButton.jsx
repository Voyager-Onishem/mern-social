import React from "react";
import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * PostActionButton
 * Unified "Post" action button used for posting and commenting.
 * Props:
 * - onClick: () => void
 * - disabled?: boolean
 * - label?: string (defaults to "Post")
 * - size?: "small" | "medium" | "large"
 * - sx?: object (additional style overrides)
 */
const PostActionButton = ({ onClick, disabled, label = "Post", size = "medium", sx }) => {
  const { palette } = useTheme();
  const enabled = !disabled;
  return (
    <Button
      size={size}
      onClick={onClick}
      disabled={disabled}
      sx={{
        borderRadius: "3rem",
        color: "white",
        backgroundColor: enabled ? palette.primary.main : "#bdbdbd",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.6,
        transition: "background 0.2s, opacity 0.2s, cursor 0.2s",
        "&:hover": {
          backgroundColor: enabled ? "#1976d2" : "#bdbdbd",
        },
        "&.Mui-disabled": {
          backgroundColor: "#bdbdbd",
          color: "white",
          opacity: 0.6,
          cursor: "not-allowed",
        },
        ...sx,
      }}
    >
      {label}
    </Button>
  );
};

export default PostActionButton;
