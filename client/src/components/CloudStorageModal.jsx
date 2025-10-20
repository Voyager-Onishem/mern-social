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
} from "@mui/material";
import {
  CloudOutlined,
  Close,
  FolderOpen,
  Image,
  InsertDriveFile,
} from "@mui/icons-material";

// Sample images from assets for demonstration
const SAMPLE_IMAGES = [
  { name: "info1.jpeg", type: "image" },
  { name: "info2.jpeg", type: "image" },
  { name: "info3.jpeg", type: "image" },
  { name: "info4.jpeg", type: "image" },
  { name: "p1.jpeg", type: "image" },
  { name: "p2.jpeg", type: "image" },
  { name: "p3.jpeg", type: "image" },
  { name: "p4.jpeg", type: "image" },
  { name: "p5.jpeg", type: "image" },
];

const CloudStorageModal = ({ open, onClose, onSelect }) => {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Simulate loading files from "cloud storage"
  useEffect(() => {
    if (open) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setFiles(SAMPLE_IMAGES);
        setLoading(false);
      }, 800);
    } else {
      setSelectedFile(null);
    }
  }, [open]);

  const handleFileClick = (file) => {
    setSelectedFile(file);
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
              <Grid item xs={4} sm={3} md={2} key={file.name}>
                <Box
                  onClick={() => handleFileClick(file)}
                  sx={{
                    p: 1,
                    border: (theme) => 
                      selectedFile?.name === file.name 
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    bgcolor: (theme) => theme.palette.background.paper,
                  }}
                >
                  {file.type === "image" ? (
                    <Image sx={{ fontSize: 48, color: "#4caf50", mb: 1 }} />
                  ) : (
                    <InsertDriveFile sx={{ fontSize: 48, color: "#2196f3", mb: 1 }} />
                  )}
                  <Typography variant="body2" noWrap sx={{ width: "100%", textAlign: "center" }}>
                    {file.name}
                  </Typography>
                </Box>
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
