
import { Box, Button, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";

const API_URL = process.env.REACT_APP_API_URL;

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const { userId } = useParams();
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const navigate = useNavigate();
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

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

  if (!user) return null;

  const isOwnProfile = loggedInUser && loggedInUser._id === userId;

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
        position="relative"
      >
        {!isOwnProfile && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/home")}
            sx={{
              position: isNonMobileScreens ? "absolute" : "static",
              left: isNonMobileScreens ? "2.5%" : undefined,
              top: isNonMobileScreens ? "1rem" : undefined,
              mb: isNonMobileScreens ? 0 : "1rem",
            }}
          >
            BACK TO HOME
          </Button>
        )}
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={userId} picturePath={user.picturePath} />
          <Box m="2rem 0" />
          <FriendListWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          {isOwnProfile && (
            <>
              <MyPostWidget picturePath={user.picturePath} />
              <Box m="2rem 0" />
            </>
          )}
          <PostsWidget userId={userId} isProfile />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
