import { Box, Typography, LinearProgress } from "@mui/material";
import { useState, useEffect } from "react";

/**
 * Password strength criteria:
 * - Weak: Less than 8 characters or only one type of characters
 * - Fair: At least 8 characters and at least 2 types of characters
 * - Good: At least 8 characters, with lowercase, uppercase, and numbers
 * - Strong: At least 8 characters, with lowercase, uppercase, numbers, and special characters
 */
export const checkPasswordStrength = (password) => {
  if (!password) return { strength: "weak", score: 0, feedback: "Password is required" };
  
  // Check for different character types
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  // Count how many character types are used
  const charTypesCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  // Calculate score (0-100)
  let score = 0;
  
  // Length contribution (up to 40 points)
  const length = password.length;
  if (length >= 12) {
    score += 40;
  } else if (length >= 8) {
    score += 25;
  } else if (length >= 6) {
    score += 10;
  }
  
  // Character type contribution (up to 60 points)
  score += charTypesCount * 15;
  
  // Cap the score at 100
  score = Math.min(score, 100);
  
  // Determine strength category and feedback
  let strength, feedback;
  
  if (score < 40) {
    strength = "weak";
    if (length < 8) {
      feedback = "Password is too short (minimum 8 characters)";
    } else {
      feedback = "Use a mix of letters, numbers, and symbols";
    }
  } else if (score < 60) {
    strength = "fair";
    if (!hasUpperCase) {
      feedback = "Add uppercase letters";
    } else if (!hasNumbers) {
      feedback = "Add numbers";
    } else {
      feedback = "Add special characters for stronger password";
    }
  } else if (score < 80) {
    strength = "good";
    if (!hasSpecialChars) {
      feedback = "Add special characters to make your password stronger";
    } else if (length < 10) {
      feedback = "Consider a longer password for better security";
    } else {
      feedback = "Good password strength";
    }
  } else {
    strength = "strong";
    feedback = "Excellent password strength";
  }
  
  return { strength, score, feedback };
};

const PasswordStrengthIndicator = ({ password }) => {
  const [strengthInfo, setStrengthInfo] = useState({ strength: "weak", score: 0, feedback: "" });
  
  useEffect(() => {
    setStrengthInfo(checkPasswordStrength(password));
  }, [password]);
  
  const getColorForStrength = (strength) => {
    switch (strength) {
      case "weak": return "error.main";
      case "fair": return "warning.main";
      case "good": return "success.light";
      case "strong": return "success.main";
      default: return "error.main";
    }
  };
  
  return (
    <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="body2" fontWeight="medium">
          Password Strength: <span style={{ textTransform: 'capitalize' }}>{strengthInfo.strength}</span>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {strengthInfo.score}/100
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={strengthInfo.score} 
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: getColorForStrength(strengthInfo.strength),
          }
        }}
      />
      <Typography variant="body2" color={getColorForStrength(strengthInfo.strength)} mt={0.5}>
        {strengthInfo.feedback}
      </Typography>
    </Box>
  );
};

export default PasswordStrengthIndicator;