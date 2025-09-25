import { useEffect } from 'react';
import { Dialog, Box, IconButton } from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';

/**
 * Simple Lightbox modal for viewing images/videos.
 * props:
 *  - open: boolean
 *  - items: Array<{ src: string, type: 'image' | 'video' }>
 *  - index: number (current item index)
 *  - onClose: () => void
 *  - onIndexChange: (nextIndex:number) => void
 */
const Lightbox = ({ open, items = [], index = 0, onClose, onIndexChange }) => {
  const total = items.length;
  const current = items[index] || null;

  const goPrev = () => {
    if (total < 2) return;
    onIndexChange((index - 1 + total) % total);
  };
  const goNext = () => {
    if (total < 2) return;
    onIndexChange((index + 1) % total);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, index, total]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" PaperProps={{ sx: { background: 'rgba(0,0,0,0.85)', boxShadow: 'none' } }}>
      <Box sx={{ position: 'relative', p: 0, m: 0, width: { xs: '90vw', sm: '80vw' }, height: { xs: '70vh', sm: '80vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <Close />
        </IconButton>
        {total > 1 && (
          <IconButton aria-label="Previous" onClick={goPrev} sx={{ position: 'absolute', left: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
            <ChevronLeft />
          </IconButton>
        )}
        {total > 1 && (
          <IconButton aria-label="Next" onClick={goNext} sx={{ position: 'absolute', right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
            <ChevronRight />
          </IconButton>
        )}
        {current && current.type === 'video' ? (
          <Box component="video" src={current.src} controls autoPlay sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 1 }} />
        ) : current ? (
          <Box component="img" src={current.src} alt="media" sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 1 }} />
        ) : null}
        {total > 1 && (
          <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, bgcolor: 'rgba(0,0,0,0.4)', px: 1, py: 0.25, borderRadius: 1 }}>
            {index + 1} / {total}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default Lightbox;
