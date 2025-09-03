import { Box, Typography, Avatar } from "@mui/material";
import { extractFirstGiphyUrl } from "utils/isGiphyUrl";
import { timeAgo } from "utils/timeAgo";
import { objectIdToDate } from "utils/objectId";

const Comment = ({ username, text, userPicturePath, createdAt }) => {
  const rawText = typeof text === "string" ? text : "";
  const gifUrl = extractFirstGiphyUrl(rawText);
  const remainingText = gifUrl ? rawText.replace(gifUrl, "").trim() : rawText;
  return (
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      {userPicturePath && (
        <Avatar src={userPicturePath} alt={username} sx={{ width: 28, height: 28 }} />
      )}
      <Box>
        <Box display="flex" alignItems="baseline" gap={1}>
          <Typography variant="subtitle2" fontWeight="bold">
            {username}
          </Typography>
          {(() => {
            if (!createdAt) return null;
            // Only treat 24-char hex strings as ObjectIds; ISO strings are also ~24 chars
            const isHexObjectId = typeof createdAt === 'string' && /^[a-fA-F0-9]{24}$/.test(createdAt);
            const inputDate = isHexObjectId ? objectIdToDate(createdAt) : createdAt;
            const label = timeAgo(inputDate);
            return label ? (
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            ) : null;
          })()}
        </Box>
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
