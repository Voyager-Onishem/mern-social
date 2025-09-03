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
        {/* Render GIF if text contains a Giphy URL, else render as text */}
        {typeof text === 'string' && text.match(/https?:\/\/(media\.)?giphy\.com\//i) ? (
          <img src={text.trim()} alt="GIF" style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }} />
        ) : (
          <Typography variant="body2">{text}</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Comment;
