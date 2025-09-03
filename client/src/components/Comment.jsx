import { Box, Typography, Avatar } from "@mui/material";

const Comment = ({ username, text, userPicturePath }) => {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      {userPicturePath && (
        <Avatar src={userPicturePath} alt={username} sx={{ width: 28, height: 28 }} />
      )}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          {username}
        </Typography>
        <Typography variant="body2">{text}</Typography>
      </Box>
    </Box>
  );
};

export default Comment;
