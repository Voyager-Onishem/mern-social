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
import { AddCircle } from "@mui/icons-material";
import { createAd } from "state/adsSlice";
import ImageUploader from "components/ImageUploader";

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

  const [selectedImage, setSelectedImage] = useState(null);

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

  const handleImageSelected = (imageFile) => {
    if (imageFile) {
      // Update form data with the file name, which will be processed server-side
      setFormData(prev => ({
        ...prev,
        picturePath: imageFile.name
      }));
      setSelectedImage(imageFile);
      // Clear any existing error
      setErrors(prev => ({
        ...prev,
        picturePath: ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        picturePath: ""
      }));
      setSelectedImage(null);
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
      picturePath: !selectedImage ? "Please upload an image" : "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    // In a real implementation, we would upload the image here
    // and then create the ad with the uploaded image path
    
    // For now, we'll just use the filename
    const adData = {
      ...formData,
      picturePath: selectedImage.name
    };

    // Dispatch action to add new ad
    dispatch(createAd(adData));
    
    // Navigate back to home
    navigate("/");
  };

  return (
    <Box>
      <Box
        width="100%"
        backgroundColor={theme.palette.background.alt}
        p="1rem 6%"
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}
      >
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{
            "&:hover": {
              color: theme.palette.primary.light,
              cursor: "pointer",
            },
          }}
        >
          Alucon
        </Typography>
        <Typography 
          variant="h4" 
          fontWeight="500" 
          color={theme.palette.neutral.main}
        >
          Create Advertisement
        </Typography>
        <Box width="clamp(1rem, 2rem, 2.25rem)"> {/* Empty box for spacing balance */}
        </Box>
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
          
          <ImageUploader onImageSelected={handleImageSelected} />
          {errors.picturePath && (
            <Typography color="error" variant="body2" sx={{ mt: -1, mb: 2 }}>
              {errors.picturePath}
            </Typography>
          )}

          <Button
            fullWidth
            type="submit"
            startIcon={<AddCircle />}
            sx={{
              m: "2rem 0",
              p: "1rem",
              backgroundColor: palette.primary.main,
              color: palette.background.alt,
              "&:hover": { color: palette.primary.main },
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            CREATE ADVERTISEMENT
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default CreateAdPage;