import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { createAd } from "state/adsSlice";

const CreateAdPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { palette } = useTheme();

  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    picturePath: ""
  });

  const [errors, setErrors] = useState({
    title: "",
    link: "",
    description: "",
    picturePath: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate description length
    if (name === "description" && value.length > 100) {
      setErrors((prev) => ({
        ...prev,
        description: "Description must be 100 characters or less"
      }));
    } else if (name === "description") {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      title: !formData.title ? "Title is required" : "",
      link: !formData.link ? "Link is required" : "",
      description: !formData.description 
        ? "Description is required" 
        : formData.description.length > 100 
          ? "Description must be 100 characters or less"
          : "",
      picturePath: !formData.picturePath ? "Picture path is required" : "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    // Dispatch action to add new ad
    dispatch(createAd(formData));
    
    // Navigate back to home
    navigate("/");
  };

  return (
    <Box>
      <Box
        width="100%"
        backgroundColor={theme.palette.background.alt}
        p="1rem 6%"
        textAlign="center"
      >
        <Typography fontWeight="bold" fontSize="32px" color="primary">
          Create Advertisement
        </Typography>
      </Box>

      <Box
        width={isNonMobileScreens ? "50%" : "93%"}
        p="2rem"
        m="2rem auto"
        borderRadius="1.5rem"
        backgroundColor={theme.palette.background.alt}
      >
        <Typography fontWeight="500" variant="h5" sx={{ mb: "1.5rem" }}>
          Create your ad to reach more users!
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
            fullWidth
          />
          
          <TextField
            label="Link (e.g., yourwebsite.com)"
            name="link"
            value={formData.link}
            onChange={handleChange}
            error={!!errors.link}
            helperText={errors.link}
            sx={{ mb: 2 }}
            fullWidth
          />
          
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description || `${formData.description.length}/100 characters`}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            fullWidth
          />
          
          <TextField
            label="Picture Path (e.g., info3.jpeg)"
            name="picturePath"
            value={formData.picturePath}
            onChange={handleChange}
            error={!!errors.picturePath}
            helperText={errors.picturePath || "Use an image from the assets folder"}
            sx={{ mb: 2 }}
            fullWidth
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Available images in assets: info1.jpeg, info2.jpeg, info3.jpeg, info4.jpeg, p1.jpeg through p13.jpeg
            </Typography>
          </Box>

          <Button
            fullWidth
            type="submit"
            sx={{
              m: "2rem 0",
              p: "1rem",
              backgroundColor: palette.primary.main,
              color: palette.background.alt,
              "&:hover": { color: palette.primary.main },
            }}
          >
            CREATE AD
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default CreateAdPage;