import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  recordProfileView,
  recordPostImpressions,
  getPostImpressionSummary,
  getProfileViewSummary,
} from '../controllers/analytics.js';

const router = express.Router();

// Phase 1 analytics endpoints
router.post('/profile-view', verifyToken, recordProfileView);
router.post('/post-impressions', verifyToken, recordPostImpressions);
router.get('/post/:id/summary', verifyToken, getPostImpressionSummary);
router.get('/profile/:id/summary', verifyToken, getProfileViewSummary);

export default router;
