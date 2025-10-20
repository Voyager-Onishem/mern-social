import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardMedia,
  CardActionArea,
} from "@mui/material";
import {
  CloudOutlined,
  Close,
  FolderOpen,
  Image as ImageIcon,
  InsertDriveFile,
  CheckCircle,
} from "@mui/icons-material";

// Sample images from assets for demonstration
// These are the confirmed images that definitely exist on the server
const SAMPLE_IMAGES = [
  { name: "info1.jpeg", type: "image" },
  { name: "info2.jpeg", type: "image" },
  { name: "info3.jpeg", type: "image" },
  { name: "info4.jpeg", type: "image" },
  { name: "p1.jpeg", type: "image" },
  { name: "p2.jpeg", type: "image" },
  { name: "p3.jpeg", type: "image" },
  { name: "p4.jpeg", type: "image" },
  
  // Removing potentially problematic images
  // { name: "p5.jpeg", type: "image" },
  // { name: "p6.jpeg", type: "image" },
  // { name: "p7.jpeg", type: "image" },
  // { name: "p8.jpeg", type: "image" },
];

// API URL for assets
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";

const CloudStorageModal = ({ open, onClose, onSelect }) => {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Simulate loading files from "cloud storage"
  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelectedFile(null);
      
      // In a real app, this would be an API call to load available images
      // For example:
      // fetch(`${API_URL}/assets`)
      //   .then(res => res.json())
      //   .then(data => {
      //     setFiles(data);
      //     setLoading(false);
      //   })
      //   .catch(err => {
      //     console.error("Error loading cloud images:", err);
      //     setLoading(false);
      //   });
      
      // Simulate API call for demo
      setTimeout(() => {
        setFiles(SAMPLE_IMAGES);
        setLoading(false);
      }, 800);
    } else {
      setSelectedFile(null);
    }
  }, [open]);

  const handleFileClick = (file) => {
    // Create a proper file object with a name property that matches what ImageUploader expects
    const selectedFileObj = {
      name: file.name,
      type: "cloud-image", // This indicates it's from cloud storage, not a real file
      isCloudFile: true, // Add a flag to indicate cloud origin
      path: `${API_URL}/assets/${file.name}`, // Add the full path for easier access
      source: "cloud-storage"
    };
    setSelectedFile(selectedFileObj);
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          overflow: "hidden",
        }
      }}
    >
      <DialogTitle sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        bgcolor: (theme) => theme.palette.background.alt,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CloudOutlined sx={{ mr: 1 }} />
          <Typography variant="h6">Select from Cloud Storage</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 2, 
        height: "400px",
        bgcolor: (theme) => theme.palette.mode === 'dark' 
          ? theme.palette.background.default 
          : '#f5f5f5'
      }}>
        {loading ? (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            height: "100%" 
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={6} sm={4} md={3} key={file.name}>
                <Card 
                  elevation={selectedFile?.name === file.name ? 6 : 1}
                  sx={{
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    transform: selectedFile?.name === file.name ? 'scale(1.03)' : 'none',
                    border: (theme) => 
                      selectedFile?.name === file.name 
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                  }}
                >
                  {selectedFile?.name === file.name && (
                    <CheckCircle 
                      sx={{ 
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'primary.main',
                        fontSize: 24,
                        zIndex: 2,
                        backgroundColor: 'white',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                  <CardActionArea onClick={() => handleFileClick(file)}>
                    <Box
                      sx={{
                        position: 'relative',
                        height: '120px',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'rgba(0,0,0,0.05)'
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="120"
                        image={`${API_URL}/assets/${file.name}`}
                        alt={file.name}
                        sx={{ 
                          objectFit: 'cover',
                          height: '100%',
                          width: '100%',
                        }}
                        onError={(e) => {
                          console.warn(`Cloud image failed to load: ${file.name}`);
                          
                          // Try alternate path if the API URL fails
                          if (!e.target.dataset.triedAlternate) {
                            e.target.dataset.triedAlternate = "true";
                            e.target.src = `/assets/${file.name}`;
                            return;
                          } 
                          
                          // Second fallback - try direct path
                          if (!e.target.dataset.triedSecondAlternate) {
                            e.target.dataset.triedSecondAlternate = "true";
                            e.target.src = `/${file.name}`;
                            return;
                          }
                          
                          // Final fallback to placeholder
                          e.target.src = "https://via.placeholder.com/120x120?text=Preview";
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" noWrap sx={{ textAlign: "center" }}>
                        {file.name}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: (theme) => theme.palette.background.alt,
      }}>
        <Box sx={{ flexGrow: 1 }}>
          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {selectedFile.name}
            </Typography>
          )}
        </Box>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleSelect} 
          color="primary" 
          variant="contained"
          disabled={!selectedFile}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CloudStorageModal;
