import { Box, Typography, Avatar } from "@mui/material";
import { extractFirstGiphyUrl } from "utils/isGiphyUrl";

const Comment = ({ username, text, userPicturePath }) => {
  const rawText = typeof text === "string" ? text : "";
  const gifUrl = extractFirstGiphyUrl(rawText);
  const remainingText = gifUrl ? rawText.replace(gifUrl, "").trim() : rawText;
  return (
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      {userPicturePath && (
        <Avatar src={userPicturePath} alt={username} sx={{ width: 28, height: 28 }} />
      )}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          {username}
        </Typography>
        {gifUrl ? (
          <>
            {remainingText && (
              <Typography variant="body2">{remainingText}</Typography>
            )}
            <img src={gifUrl} alt={"GIF"} style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }} />
          </>
        ) : (
          <Typography variant="body2">{text}</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Comment;
