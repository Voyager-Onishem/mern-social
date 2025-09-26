import React, { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, Box, TextField, Grid, CircularProgress, Typography, IconButton, Button, Tooltip, Fade } from "@mui/material";
import { Refresh, WarningAmberOutlined, SearchOff, ImageOutlined } from '@mui/icons-material';
import { searchGifs, trendingGifs, hasGiphyKey } from "../api/giphyApi";

const GiphyPicker = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initial, setInitial] = useState(true);
  const [lastQuery, setLastQuery] = useState(null);
  const abortRef = useRef(null);

  const runFetch = useCallback(async (mode, q) => {
    if (!hasGiphyKey) return;
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (mode === 'search') {
        setLastQuery(q);
        res = await searchGifs(q);
      } else {
        res = await trendingGifs();
      }
      setGifs(res);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Failed to load GIFs');
      setGifs([]);
    } finally {
      setLoading(false);
      setInitial(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open || !hasGiphyKey) return;
    const q = search.trim();
    if (q.length < 2) {
      runFetch('trending');
      return;
    }
    const t = setTimeout(() => runFetch('search', q), 350);
    return () => clearTimeout(t);
  }, [open, search, runFetch]);

  // Keyboard shortcuts: ESC handled by Dialog; add / for quick focus search
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const el = document.getElementById('giphy-search-input');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Pick a GIF
        <Box>
          <Tooltip title="Reload" arrow>
            <span>
              <IconButton size="small" disabled={loading || !hasGiphyKey} onClick={() => {
                const q = search.trim();
                if (q.length < 2) runFetch('trending'); else runFetch('search', q);
              }} aria-label="Reload GIFs">
                <Refresh fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogTitle>
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
          id="giphy-search-input"
          placeholder="Type to search ( / to focus )"
        />
        <Box mt={2}>
          {loading && (
            <Grid container spacing={2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={3} key={i}>
                  <Box sx={{
                    width: '100%',
                    height: 90,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.06)',
                    animation: 'pulse 1.2s ease-in-out infinite'
                  }} />
                </Grid>
              ))}
            </Grid>
          )}
          {!loading && error && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <WarningAmberOutlined color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography color="error" gutterBottom>{error}</Typography>
              <Button variant="outlined" size="small" onClick={() => {
                if (lastQuery) runFetch('search', lastQuery); else runFetch('trending');
              }}>Retry</Button>
            </Box>
          )}
          {!loading && !error && gifs.length === 0 && !initial && (
            <Box sx={{ textAlign: 'center', py: 4, opacity: 0.8 }}>
              <SearchOff sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">No results{search.trim() ? ` for "${search.trim()}"` : ''}</Typography>
              {search.trim().length >= 2 && (
                <Button size="small" sx={{ mt: 1 }} onClick={() => setSearch("")}>Clear search</Button>
              )}
            </Box>
          )}
          {!loading && !error && gifs.length > 0 && (
            <Grid container spacing={2}>
              {gifs.map((gif) => {
                const small = gif.images?.fixed_height_small || gif.images?.downsized_still || gif.images?.preview || gif.images?.original;
                const original = gif.images?.original?.url;
                return (
                  <Grid item xs={3} key={gif.id}>
                    <Box
                      component="img"
                      src={small?.url}
                      alt={gif.title || 'GIF'}
                      loading="lazy"
                      role="button"
                      tabIndex={0}
                      aria-label={`Select GIF ${gif.title || gif.id}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (original) { onSelect(original); onClose(); }
                        }
                      }}
                      onClick={() => {
                        if (original) {
                          onSelect(original);
                          onClose();
                        }
                      }}
                      sx={{ width: '100%', cursor: 'pointer', borderRadius: 1, transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.04)' } }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GiphyPicker;
