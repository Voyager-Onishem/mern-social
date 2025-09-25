import {
  ManageAccountsOutlined,
  EditOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Snackbar, Alert, Tooltip, Avatar } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useSelector, useDispatch } from "react-redux";
import { setLogin } from "state";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const UserWidget = ({ userId, picturePath, openInlineEdit = false }) => {
  const [user, setUser] = useState(null);
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
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedUser = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;

  const getUser = async () => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  useEffect(() => {
    getUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    return null;
  }

  const {
    firstName,
    lastName,
    location,
    occupation,
    viewedProfile,
    impressions,
    friends,
  } = user;

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
            <Typography color={medium}>{friends.length} friends</Typography>
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
            {viewedProfile}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography color={medium}>Impressions of your post</Typography>
          <Typography color={main} fontWeight="500">
            {impressions}
          </Typography>
        </FlexBetween>
      </Box>

      <Divider />

      {/* FOURTH ROW */}
      <Box p="1rem 0">
        <Typography fontSize="1rem" color={main} fontWeight="500" mb="1rem">
          Social Profiles
        </Typography>

        <FlexBetween gap="1rem" mb="0.5rem">
          <FlexBetween gap="1rem">
            <img src="../assets/twitter.png" alt="twitter" />
            <Box>
              <Typography color={main} fontWeight="500">
                Twitter
              </Typography>
              <Typography color={medium}>Social Network</Typography>
            </Box>
          </FlexBetween>
          <EditOutlined sx={{ color: main }} />
        </FlexBetween>

        <FlexBetween gap="1rem">
          <FlexBetween gap="1rem">
            <img src="../assets/linkedin.png" alt="linkedin" />
            <Box>
              <Typography color={main} fontWeight="500">
                Linkedin
              </Typography>
              <Typography color={medium}>Network Platform</Typography>
            </Box>
          </FlexBetween>
          <EditOutlined sx={{ color: main }} />
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
