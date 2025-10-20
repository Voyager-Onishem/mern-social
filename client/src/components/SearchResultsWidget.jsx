import { useState, useEffect } from "react";
import { Box, Typography, Divider, List, ListItem, ListItemAvatar, ListItemText, Avatar, useTheme, CircularProgress } from "@mui/material";
import { Person, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { timeAgo } from "../utils/timeAgo";

const SearchResultsWidget = ({ searchResults, isLoading, error, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const main = theme.palette.neutral.main;

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    if (onClose) onClose();
  };

  const handlePostClick = (postId, userId) => {
    // First navigate to the user's profile page who created the post
    // Then add a query parameter to scroll to the specific post
    navigate(`/profile/${userId}?post=${postId}`);
    if (onClose) onClose();
  };

  // Empty state
  if (!isLoading && (!searchResults || 
    ((!searchResults.users || searchResults.users.length === 0) && 
     (!searchResults.posts || searchResults.posts.length === 0)))) {
    return (
      <WidgetWrapper>
        <Typography color={main} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
          No results found
        </Typography>
        <Typography color={main}>
          Try searching with different keywords.
        </Typography>
      </WidgetWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <WidgetWrapper>
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      </WidgetWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <WidgetWrapper>
        <Typography color="error" variant="h5" fontWeight="500" sx={{ mb: "1rem" }}>
          Search Error
        </Typography>
        <Typography>{error.message || "Failed to perform search"}</Typography>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <Typography color={main} variant="h5" fontWeight="500" sx={{ mb: "1rem" }}>
        Search Results ({searchResults.counts?.total || 0})
      </Typography>
      
      {searchResults.users && searchResults.users.length > 0 && (
        <>
          <FlexBetween mb="0.5rem">
            <Typography color={main} fontWeight="500">
              People ({searchResults.users.length})
            </Typography>
          </FlexBetween>
          <Divider />
          <List sx={{ width: '100%' }}>
            {searchResults.users.map((user) => (
              <ListItem 
                key={user._id} 
                alignItems="flex-start" 
                onClick={() => handleUserClick(user._id)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: neutralLight }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    alt={`${user.firstName} ${user.lastName}`} 
                    src={`${process.env.REACT_APP_API_URL || ""}/assets/${user.picturePath}`}
                  >
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={
                    <>
                      {user.occupation && (
                        <Typography component="span" variant="body2" color="text.primary">
                          {user.occupation}
                        </Typography>
                      )}
                      {user.location && (
                        <Typography component="span" variant="body2" color="text.primary">
                          {user.occupation ? ` — ${user.location}` : user.location}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {searchResults.posts && searchResults.posts.length > 0 && (
        <>
          <Box mt={2}>
            <FlexBetween mb="0.5rem">
              <Typography color={main} fontWeight="500">
                Posts ({searchResults.posts.length})
              </Typography>
            </FlexBetween>
            <Divider />
            <List sx={{ width: '100%' }}>
              {searchResults.posts.map((post) => (
                <ListItem 
                  key={post._id} 
                  alignItems="flex-start" 
                  onClick={() => handlePostClick(post._id, post.userId)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: neutralLight }
                  }}
                >
                  <ListItemAvatar>
                    {post.mediaPaths && post.mediaPaths.length > 0 ? (
                      <Avatar 
                        variant="rounded" 
                        alt="Post media" 
                        src={`${process.env.REACT_APP_API_URL || ""}/assets/${post.mediaPaths[0]}`}
                      >
                        <Description />
                      </Avatar>
                    ) : (
                      <Avatar variant="rounded">
                        <Description />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${post.firstName} ${post.lastName}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block' }}>
                          {post.description ? 
                            (post.description.length > 60 ? 
                              `${post.description.substring(0, 60)}...` : 
                              post.description) : 
                            "No description"}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {timeAgo(post.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}
    </WidgetWrapper>
  );
};

export default SearchResultsWidget;