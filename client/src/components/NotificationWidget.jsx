import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  FavoriteBorder,
  ChatBubbleOutline,
  PersonAdd,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markAsRead, markAllAsRead } from '../state/notificationsSlice';
import { patch } from '../utils/apiClient';
import FlexBetween from './FlexBetween';

const NotificationWidget = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await patch(
          `/notifications/${notification._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(markAsRead(notification._id));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Navigate to relevant page
    if (notification.postId) {
      // Navigate to home page with post query parameter to highlight the post
      navigate(`/home?post=${notification.postId}`);
    } else if (notification.type === 'friend_request' || notification.type === 'friend_accept') {
      navigate(`/profile/${notification.fromUserId}`);
    }

    handleClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await patch(
        '/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(markAllAsRead());
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FavoriteBorder sx={{ color: '#e91e63' }} />;
      case 'comment':
        return <ChatBubbleOutline sx={{ color: '#2196f3' }} />;
      case 'friend_request':
        return <PersonAdd sx={{ color: '#4caf50' }} />;
      case 'friend_accept':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'inherit' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ fontSize: '25px' }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <FlexBetween>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </FlexBetween>
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <Box display="flex" gap={1.5} width="100%">
                <Box sx={{ mt: 0.5 }}>{getNotificationIcon(notification.type)}</Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={notification.fromUserPicture}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Box flex={1}>
                      <Typography variant="body2" noWrap>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      mt: 1,
                    }}
                  />
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationWidget;
