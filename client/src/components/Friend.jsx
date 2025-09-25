import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";

const API_URL = process.env.REACT_APP_API_URL;

const Friend = ({ friendId, name, subtitle, userPicturePath, onFriendToggled }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = Array.isArray(friends) && friends.find((friend) => friend._id === friendId);

  const patchFriend = async () => {
    // Prevent adding/removing yourself as a friend
    if (_id === friendId) return;
    const response = await fetch(
      `${API_URL}/users/${_id}/${friendId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
    if (onFriendToggled) onFriendToggled(friendId, !!isFriend);
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
            navigate(0);
          }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              "&:hover": {
                color: palette.primary.light,
                cursor: "pointer",
              },
            }}
          >
            {name}
            {_id === friendId && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.2,
                  bgcolor: palette.primary.light,
                  color: palette.primary.contrastText,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                YOU
              </Box>
            )}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      {/* Only show add/remove friend button if not yourself */}
      {_id !== friendId && (
        <IconButton
          onClick={() => patchFriend()}
          sx={{ backgroundColor: primaryLight, p: "0.6rem" }}
        >
          {isFriend ? (
            <PersonRemoveOutlined sx={{ color: primaryDark }} />
          ) : (
            <PersonAddOutlined sx={{ color: primaryDark }} />
          )}
        </IconButton>
      )}
    </FlexBetween>
  );
};

export default Friend;
