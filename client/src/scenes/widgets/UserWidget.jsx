import {
  ManageAccountsOutlined,
  EditOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Snackbar, Alert, Tooltip, Avatar, Skeleton } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useSelector, useDispatch } from "react-redux";
import { setLogin, setUserProfileViewsTotal } from "state";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";

const UserWidget = ({ userId, picturePath, openInlineEdit = false }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draftLocation, setDraftLocation] = useState("");
  const [draftOccupation, setDraftOccupation] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [draftTwitter, setDraftTwitter] = useState("");
  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftPictureFile, setDraftPictureFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });
  const [impressionsTotal, setImpressionsTotal] = useState(null);
  const [serverStatus, setServerStatus] = useState("unknown"); // "online", "offline", "unknown"
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedUser = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;
  // Prevent duplicate profile view recordings while staying on same profile
  const profileViewRecordedRef = useRef(false);

  const getUser = async () => {
    if (!userId || !token) {
      setError("Missing userId or token");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching user data for ${userId} from ${API_URL}/users/${userId}`);
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        // Add a timeout to prevent long hanging requests
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching user: ${response.status} ${response.statusText}`, errorText);
        setError(`Error: ${response.status} ${response.statusText}`);
        setServerStatus("offline");
        return;
      }
      
      const data = await response.json();
      setUser(data);
      setServerStatus("online");
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError(`Failed to fetch user data: ${err.message}`);
      setServerStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/test`, {
        method: "GET",
        // Add a timeout to prevent long hanging requests
        signal: AbortSignal.timeout(5000) // 5 seconds timeout
      });
      
      if (response.ok) {
        console.log("Server is online");
        setServerStatus("online");
        return true;
      } else {
        console.log("Server returned error:", response.status);
        setServerStatus("offline");
        return false;
      }
    } catch (err) {
      console.error("Server connectivity check failed:", err);
      setServerStatus("offline");
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // First check if server is reachable
      const isServerOnline = await checkServerStatus();
      
      if (isServerOnline) {
        getUser();
      } else {
        setLoading(false);
        setError("Cannot connect to server. Please try again later.");
      }
    };
    
    loadData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
    
  // Record a profile view (Feature 26 Phase 1) once user data present & not own profile
  useEffect(() => {
    if (!user || !token) return;
    if (loggedUser?._id === userId) return; // skip self views
    // Fire only once per profileId until unmounted or userId changes
    if (profileViewRecordedRef.current) return;
      profileViewRecordedRef.current = true; // lock before async to avoid rapid double fire
      let aborted = false;
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/analytics/profile-view`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileUserId: userId })
          });
          const data = await resp.json().catch(() => ({}));
          if (aborted) return;
          if (resp.ok && typeof data.profileViewsTotal === 'number') {
            // Only update global store if this is the logged-in user's own profile
            if (loggedUser?._id === userId) {
              dispatch(setUserProfileViewsTotal({ profileViewsTotal: data.profileViewsTotal }));
            }
            // Always update local viewed profile object
            setUser(prev => prev ? { ...prev, profileViewsTotal: data.profileViewsTotal } : prev);
          }
        } catch {
          // On failure we could allow retry by resetting ref, but for now keep it locked to avoid inflation
        }
      })();
      return () => { aborted = true; };
    }, [user, token, userId, loggedUser, dispatch]);

    // Reset the guard if navigating to a different profile id
    useEffect(() => {
      profileViewRecordedRef.current = false;
    }, [userId]);

    // Fetch aggregated impressions total for the profile owner (Feature 26 Phase 1 display)
    useEffect(() => {
      if (!token || !userId) return;
      let aborted = false;
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/analytics/user/${userId}/impressions`, { headers: { 'Authorization': `Bearer ${token}` } });
          const data = await resp.json().catch(() => ({}));
          if (aborted) return;
          if (resp.ok && typeof data.impressionsTotal === 'number') {
            setImpressionsTotal(data.impressionsTotal);
          } else {
            setImpressionsTotal(0);
          }
        } catch {
          if (!aborted) setImpressionsTotal(0);
        }
      })();
      return () => { aborted = true; };
    }, [token, userId]);

  const isOwnProfile = loggedUser?._id === userId;

  const openEdit = () => {
    if (!user) return;
  setDraftLocation(user.location || '');
  setDraftOccupation(user.occupation || '');
  setDraftRole(user.role || '');
  setDraftFirst(user.firstName || '');
  setDraftLast(user.lastName || '');
  setDraftTwitter(user.twitterUrl || '');
  setDraftLinkedin(user.linkedinUrl || '');
  setDraftPictureFile(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const prevLocal = { location: user.location, occupation: user.occupation, role: user.role, firstName: user.firstName, lastName: user.lastName, twitterUrl: user.twitterUrl, linkedinUrl: user.linkedinUrl, picturePath: user.picturePath };
    const prevGlobal = isOwnProfile ? { location: loggedUser.location, occupation: loggedUser.occupation, role: loggedUser.role, firstName: loggedUser.firstName, lastName: loggedUser.lastName, twitterUrl: loggedUser.twitterUrl, linkedinUrl: loggedUser.linkedinUrl, picturePath: loggedUser.picturePath } : null;
    // Optimistic update
    setUser((prev) => ({ ...prev, location: draftLocation, occupation: draftOccupation, role: draftRole, firstName: draftFirst, lastName: draftLast, twitterUrl: draftTwitter, linkedinUrl: draftLinkedin }));
    if (isOwnProfile) {
      dispatch(setLogin({ user: { ...loggedUser, location: draftLocation, occupation: draftOccupation, role: draftRole, firstName: draftFirst, lastName: draftLast, twitterUrl: draftTwitter, linkedinUrl: draftLinkedin }, token }));
    }
    try {
      let body;
      let headers = { 'Authorization': `Bearer ${token}` };
      if (draftPictureFile) {
        body = new FormData();
        body.append('location', draftLocation);
        body.append('occupation', draftOccupation);
        body.append('role', draftRole);
        body.append('firstName', draftFirst);
        body.append('lastName', draftLast);
        body.append('twitterUrl', draftTwitter);
        body.append('linkedinUrl', draftLinkedin);
        body.append('picture', draftPictureFile);
      } else {
        body = JSON.stringify({ location: draftLocation, occupation: draftOccupation, role: draftRole, firstName: draftFirst, lastName: draftLast, twitterUrl: draftTwitter, linkedinUrl: draftLinkedin });
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(`${API_URL}/users/${userId}`, { method: 'PATCH', headers, body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // rollback
        setUser((prev) => ({ ...prev, ...prevLocal }));
        if (isOwnProfile && prevGlobal) {
          dispatch(setLogin({ user: { ...loggedUser, ...prevGlobal }, token }));
        }
        setSnack({ open: true, msg: data?.error || data?.message || 'Update failed', severity: 'error' });
      } else {
        // ensure normalized data from server (in case server sanitized)
        setUser((prev) => ({ ...prev, location: data.location, occupation: data.occupation, role: data.role, firstName: data.firstName, lastName: data.lastName, twitterUrl: data.twitterUrl, linkedinUrl: data.linkedinUrl, picturePath: data.picturePath }));
        if (isOwnProfile) {
          dispatch(setLogin({ user: { ...loggedUser, location: data.location, occupation: data.occupation, role: data.role, firstName: data.firstName, lastName: data.lastName, twitterUrl: data.twitterUrl, linkedinUrl: data.linkedinUrl, picturePath: data.picturePath }, token }));
        }
        setSnack({ open: true, msg: 'Profile updated', severity: 'success' });
        setEditOpen(false);
      }
    } catch (e) {
      // rollback on network error
      setUser((prev) => ({ ...prev, ...prevLocal }));
      if (isOwnProfile && prevGlobal) {
        dispatch(setLogin({ user: { ...loggedUser, ...prevGlobal }, token }));
      }
      setSnack({ open: true, msg: 'Network error updating profile', severity: 'error' });
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <WidgetWrapper>
        <Box display="flex" gap={1.5} pb={2}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box flex={1}>
            <Skeleton variant="text" width={140} height={28} />
            <Skeleton variant="text" width={80} height={20} />
          </Box>
        </Box>
        <Divider />
        <Box py={2}>
          <Skeleton variant="text" width={180} height={20} />
          <Skeleton variant="text" width={160} height={20} />
        </Box>
        <Divider />
        <Box py={2}>
          <Skeleton variant="text" width={190} height={20} />
          <Skeleton variant="text" width={190} height={20} />
        </Box>
        <Divider />
        <Box py={2}>
          <Skeleton variant="text" width={150} height={24} />
          <Box mt={1} display="flex" flexDirection="column" gap={1}>
            <Skeleton variant="rectangular" height={32} width="100%" sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={32} width="100%" sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      </WidgetWrapper>
    );
  }

  const {
    firstName,
    lastName,
    location,
    occupation,
    viewedProfile, // legacy field
    impressions, // legacy placeholder (ignored in favor of aggregated total)
    profileViewsTotal,
    friends = [], // Default to empty array if undefined
  } = user || {}; // Default to empty object if user is null

  // helpers for social link formatting (lightweight, inline – avoids extra deps)
  const ensureHttps = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^(https?:)?\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };
  const displayHost = (url) => {
    if (!url) return '';
    try {
      const u = new URL(ensureHttps(url));
      return u.hostname.replace(/^www\./i, '') + (u.pathname && u.pathname !== '/' ? u.pathname : '');
    } catch {
      return url;
    }
  };
  const twUrl = user.twitterUrl || '';
  const liUrl = user.linkedinUrl || '';

  return (
    <WidgetWrapper>
      {/* FIRST ROW */}
      <FlexBetween
        gap="0.5rem"
        pb="1.1rem"
        onClick={() => {
          if (openInlineEdit && isOwnProfile) {
            openEdit();
          } else {
            navigate(`/profile/${userId}`);
          }
        }}
      >
        <FlexBetween gap="1rem">
          <UserImage image={picturePath} />
          <Box>
            <Typography
              variant="h4"
              color={dark}
              fontWeight="500"
              sx={{
                "&:hover": {
                  color: palette.primary.light,
                  cursor: "pointer",
                },
              }}
            >
              {firstName} {lastName}
            </Typography>
            <Typography color={medium}>{friends && Array.isArray(friends) ? friends.length : 0} friends</Typography>
          </Box>
        </FlexBetween>
        {isOwnProfile && (
          <Tooltip title="Edit profile" arrow>
            <IconButton size="small" onClick={openEdit} aria-label="Edit profile">
              <ManageAccountsOutlined />
            </IconButton>
          </Tooltip>
        )}
      </FlexBetween>

      <Divider />

      {/* SECOND ROW */}
      <Box p="1rem 0">
        <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{location || (isOwnProfile ? 'Add your location' : '')}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="1rem">
          <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{occupation || (isOwnProfile ? 'Add your occupation' : '')}</Typography>
        </Box>
      </Box>

      <Divider />

      {/* THIRD ROW */}
      <Box p="1rem 0">
        <FlexBetween mb="0.5rem">
          <Typography color={medium}>Who's viewed your profile</Typography>
          <Typography color={main} fontWeight="500">
            {typeof profileViewsTotal === 'number' ? profileViewsTotal : (typeof viewedProfile === 'number' ? viewedProfile : 0)}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography color={medium}>Impressions of your posts</Typography>
          <Typography color={main} fontWeight="500" aria-label={`Total post impressions ${impressionsTotal ?? 0}`}>
            {impressionsTotal ?? 0}
          </Typography>
        </FlexBetween>
      </Box>

      <Divider />

      {/* FOURTH ROW - SOCIAL PROFILES */}
      <Box p="1rem 0">
        <Typography fontSize="1rem" color={main} fontWeight="500" mb="1rem">Social Profiles</Typography>

        <FlexBetween gap="1rem" mb="0.75rem">
          <FlexBetween gap="0.75rem">
            <img src="../assets/twitter.png" alt="Twitter" width={32} height={32} style={{ objectFit: 'contain' }} />
            <Box>
              <Typography color={main} fontWeight="500">Twitter</Typography>
              {twUrl ? (
                <Typography component="a"
                  href={ensureHttps(twUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  color={palette.primary.main}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, wordBreak: 'break-all' }}
                >
                  {displayHost(twUrl)}
                </Typography>
              ) : (
                <Typography color={medium} fontSize="0.8rem">{isOwnProfile ? 'Add your Twitter link' : 'Not provided'}</Typography>
              )}
            </Box>
          </FlexBetween>
          {isOwnProfile && (
            <Tooltip title={twUrl ? 'Edit Twitter link' : 'Add Twitter link'} arrow>
              <IconButton size="small" onClick={openEdit} aria-label="Edit Twitter profile link">
                <EditOutlined sx={{ color: main }} />
              </IconButton>
            </Tooltip>
          )}
        </FlexBetween>

        <FlexBetween gap="1rem">
          <FlexBetween gap="0.75rem">
            <img src="../assets/linkedin.png" alt="LinkedIn" width={32} height={32} style={{ objectFit: 'contain' }} />
            <Box>
              <Typography color={main} fontWeight="500">LinkedIn</Typography>
              {liUrl ? (
                <Typography component="a"
                  href={ensureHttps(liUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  color={palette.primary.main}
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, wordBreak: 'break-all' }}
                >
                  {displayHost(liUrl)}
                </Typography>
              ) : (
                <Typography color={medium} fontSize="0.8rem">{isOwnProfile ? 'Add your LinkedIn link' : 'Not provided'}</Typography>
              )}
            </Box>
          </FlexBetween>
          {isOwnProfile && (
            <Tooltip title={liUrl ? 'Edit LinkedIn link' : 'Add LinkedIn link'} arrow>
              <IconButton size="small" onClick={openEdit} aria-label="Edit LinkedIn profile link">
                <EditOutlined sx={{ color: main }} />
              </IconButton>
            </Tooltip>
          )}
        </FlexBetween>
      </Box>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={draftPictureFile ? URL.createObjectURL(draftPictureFile) : (user.picturePath ? `${API_URL}/assets/${user.picturePath}` : undefined)} alt="avatar" />
            <Button component="label" size="small" variant="outlined">Change Picture
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setDraftPictureFile(f); }} />
            </Button>
            {draftPictureFile && (
              <Button size="small" color="secondary" onClick={() => setDraftPictureFile(null)}>Reset</Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="First Name" value={draftFirst} onChange={(e) => setDraftFirst(e.target.value)} size="small" fullWidth autoFocus />
            <TextField label="Last Name" value={draftLast} onChange={(e) => setDraftLast(e.target.value)} size="small" fullWidth />
          </Box>
            <TextField label="Role" value={draftRole} onChange={(e) => setDraftRole(e.target.value)} size="small" />
            <TextField label="Location" value={draftLocation} onChange={(e) => setDraftLocation(e.target.value)} size="small" />
            <TextField label="Occupation" value={draftOccupation} onChange={(e) => setDraftOccupation(e.target.value)} size="small" />
            <TextField label="Twitter URL" value={draftTwitter} onChange={(e) => setDraftTwitter(e.target.value)} size="small" />
            <TextField label="LinkedIn URL" value={draftLinkedin} onChange={(e) => setDraftLinkedin(e.target.value)} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || (!draftLocation.trim() && !draftOccupation.trim() && !draftRole.trim() && !draftFirst.trim() && !draftLast.trim() && !draftTwitter.trim() && !draftLinkedin.trim() && !draftPictureFile)} variant="contained">{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default UserWidget;
