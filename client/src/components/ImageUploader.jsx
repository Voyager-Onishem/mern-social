import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  Paper,
  Stack,
} from "@mui/material";
import {
  CloudUpload,
  Image,
  InsertDriveFile,
  Close,
  CloudDone,
  Cloud
} from "@mui/icons-material";
import Dropzone from "react-dropzone";
import CloudStorageModal from "./CloudStorageModal";

const ImageUploader = ({ onImageSelected }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const theme = useTheme();
  const fileInputRef = useRef();

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (file) {
      // Check if file is an image
      if (file.type && !file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Check file size if it's a real file (not a cloud reference)
      if (file.size && file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit");
        return;
      }

      setImage(file);
      
      // Create a preview URL for real files
      if (file.type) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For cloud files, use a placeholder or asset path
        setPreviewUrl(`/assets/${file.name}`);
      }
      
      // Pass the file to the parent component
      onImageSelected(file);
    }
  };
  
  const handleCloudSelect = (file) => {
    // Handle cloud storage file selection
    processFile(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
    onImageSelected(null);
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography fontWeight="500" variant="h6" sx={{ mb: 1 }}>
        Advertisement Image
      </Typography>
      
      {!image ? (
        <Dropzone
          accept={{ 'image/*': [] }}
          multiple={false}
          onDrop={handleDrop}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
        >
          {({ getRootProps, getInputProps }) => (
            <Paper
              sx={{
                p: 3,
                border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.neutral.light}`,
                borderRadius: "10px",
                cursor: "pointer",
                bgcolor: dragActive ? 
                  theme.palette.mode === 'dark' ? 'rgba(58, 130, 246, 0.1)' : 'rgba(58, 130, 246, 0.05)' : 
                  theme.palette.background.alt,
                transition: "all 0.3s ease",
                textAlign: "center",
                minHeight: "150px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, mb: 1, color: theme.palette.primary.main }} />
              <Typography variant="body1">
                Drag and drop an image here, or click to select
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                (Maximum size: 5MB)
              </Typography>
            </Paper>
          )}
        </Dropzone>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            p: 1,
            border: `1px solid ${theme.palette.neutral.light}`,
            borderRadius: "10px",
          }}
        >
          <IconButton
            size="small"
            sx={{
              position: "absolute",
              top: 5,
              right: 5,
              bgcolor: theme.palette.background.default,
              "&:hover": { bgcolor: theme.palette.neutral.light },
            }}
            onClick={handleRemoveImage}
          >
            <Close />
          </IconButton>
          
          <Box
            sx={{
              mt: 1,
              mb: 1,
              width: "100%",
              height: "200px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "8px",
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              position: "relative",
            }}
          >
            <img
              src={previewUrl}
              alt="Selected"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            {image.type ? (
              // Local file
              <>
                <CloudDone sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {image.name} ({(image.size / 1024).toFixed(1)} KB)
                </Typography>
              </>
            ) : (
              // Cloud file
              <>
                <Cloud sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {image.name} (Cloud Storage)
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}
      
      {!image && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1, gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Image />}
            onClick={() => fileInputRef.current.click()}
            sx={{ mt: 1 }}
          >
            Browse for image
          </Button>
          <Button
            variant="outlined"
            startIcon={<Cloud />}
            onClick={() => setCloudModalOpen(true)}
            sx={{ mt: 1 }}
          >
            Select from Cloud
          </Button>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </Box>
      )}
      
      {/* Cloud Storage Modal */}
      <CloudStorageModal 
        open={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        onSelect={handleCloudSelect}
      />
    </Box>
  );
};

export default ImageUploader;