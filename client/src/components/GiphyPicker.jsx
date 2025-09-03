import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, TextField, Grid, CircularProgress, Typography } from "@mui/material";
import { searchGifs, trendingGifs, hasGiphyKey } from "../api/giphyApi";

const GiphyPicker = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!hasGiphyKey) return;
    let active = true;
    const q = search.trim();
    if (q.length < 2) {
      // Load trending when no/short query
      setLoading(true);
      trendingGifs().then((res) => {
        if (active) setGifs(res);
      }).catch(() => {
        if (active) setGifs([]);
      }).finally(() => active && setLoading(false));
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchGifs(q).then((res) => {
        if (active) setGifs(res);
      }).catch(() => {
        if (active) setGifs([]);
      }).finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [open, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Pick a GIF</DialogTitle>
      <DialogContent>
        {!hasGiphyKey && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            Missing REACT_APP_GIPHY_API_KEY. Add it to client/.env and restart the dev server.
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Search GIFs"
          type="text"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box mt={2}>
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {gifs.map((gif) => (
                <Grid item xs={3} key={gif.id}>
                  <img
                    src={gif.images.fixed_height_small.url}
                    alt={gif.title}
                    style={{ width: "100%", cursor: "pointer" }}
                    onClick={() => {
                      onSelect(gif.images.original.url);
                      onClose();
                    }}
                  />
                </Grid>
              ))}
              {!loading && gifs.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">No GIFs</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GiphyPicker;
