import { Box, Typography, useTheme } from "@mui/material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFriends = async () => {
    if (!userId || !token) {
      console.log("Missing userId or token, can't fetch friends");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching friends for user ${userId} from ${API_URL}/users/${userId}/friends`);
      const response = await fetch(
        `${API_URL}/users/${userId}/friends`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching friends: ${response.status} ${response.statusText}`, errorText);
        setError(`Error fetching friends: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} friends for user ${userId}`);
      dispatch(setFriends({ friends: data }));
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setError(`Failed to fetch friends: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFriends();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalize and de-duplicate friends to ensure stable unique keys
  const processedFriends = Array.isArray(friends)
    ? friends.filter(Boolean).reduce((acc, f) => {
        const id = f && (f._id || f.id);
        if (id && !acc._seen.has(id)) { acc._seen.add(id); acc.items.push(f); }
        else if (!id) { // fallback include once using a composite temp key
          acc.items.push(f);
        }
        return acc;
      }, { _seen: new Set(), items: [] }).items
    : [];

  return (
    <WidgetWrapper>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
        {loading && " (Loading...)"}
      </Typography>
      
      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}
      
      <Box display="flex" flexDirection="column" gap="1.5rem">
        {processedFriends.map((friend, idx) => {
          const keyBase = friend?._id || friend?.id || `${friend?.firstName || 'friend'}-${friend?.lastName || 'x'}`;
          return (
            <Friend
              key={`${keyBase}-${idx}`}
              friendId={friend._id || friend.id}
              name={`${friend.firstName} ${friend.lastName}`}
              subtitle={friend.occupation}
              userPicturePath={friend.picturePath}
              onFriendToggled={() => { /* Could trigger toast or refresh if needed */ }}
            />
          );
        })}
      </Box>
    </WidgetWrapper>
  );
};

export default FriendListWidget;
