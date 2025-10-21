import { Box, Typography, Avatar, IconButton, TextField, Tooltip } from "@mui/material";
import { EditOutlined, DeleteOutline, SaveOutlined, Close } from "@mui/icons-material";
import { extractGiphyUrls } from "utils/isGiphyUrl";
import { timeAgo } from "utils/timeAgo";
import { objectIdToDate } from "utils/objectId";

const Comment = ({
  commentId,
  username,
  text,
  userPicturePath,
  createdAt,
  editedAt,
  canEdit = false,
  isEditing = false,
  editText = "",
  onStartEdit,
  onEditTextChange,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) => {
  const rawText = typeof text === "string" ? text : "";
  // Extract all GIF URLs (previously only first was rendered)
  const gifUrls = extractGiphyUrls(rawText) || [];
  // Remove all occurrences of extracted GIF URLs from the display text
  let remainingText = rawText;
  if (gifUrls.length) {
    gifUrls.forEach(u => {
      // Use simple replaceAll fallback: replace all exact occurrences (case sensitive) then trim extra whitespace
      // We add surrounding spaces before collapsing to reduce leftover double spaces.
      remainingText = remainingText.split(u).join(" ");
    });
    remainingText = remainingText.replace(/\s+/g, " ").trim();
  }
  const displayDate = (() => {
    if (!createdAt) return null;
    const isHexObjectId = typeof createdAt === 'string' && /^[a-fA-F0-9]{24}$/.test(createdAt);
    const inputDate = isHexObjectId ? objectIdToDate(createdAt) : createdAt;
    return timeAgo(inputDate);
  })();

  return (
    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
      {userPicturePath && (
        <Avatar src={userPicturePath} alt={username} sx={{ width: 28, height: 28 }} />
      )}
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="baseline" gap={1}>
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {username}
          </Typography>
          {displayDate && (
            <Tooltip title={editedAt ? `Edited ${timeAgo(editedAt)} (original ${displayDate})` : `Posted ${displayDate}`} arrow>
              <Typography variant="caption" color="text.secondary" aria-label={editedAt ? `Edited comment, last edit ${timeAgo(editedAt)}` : `Comment posted ${displayDate}`}>
                {displayDate}{editedAt ? ' (edited)' : ''}
              </Typography>
            </Tooltip>
          )}
        </Box>
        {isEditing ? (
          <Box mt={0.5} display="flex" flexDirection="column" gap={1}>
            <TextField
              size="small"
              value={editText}
              onChange={(e) => onEditTextChange && onEditTextChange(e.target.value)}
              multiline
              maxRows={4}
              autoFocus
            />
            <Box display="flex" gap={1}>
              <Tooltip title="Save" arrow>
                <span>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onSaveEdit && onSaveEdit(commentId, editText)}
                    disabled={!editText.trim()}
                    aria-label="Save edited comment"
                  >
                    <SaveOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancel" arrow>
                <IconButton size="small" onClick={onCancelEdit} aria-label="Cancel editing comment">
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Box mt={0.25}>
            {remainingText && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{remainingText}</Typography>
            )}
            {gifUrls.length > 0 && (
              <Box mt={remainingText ? 0.5 : 0} display="flex" flexWrap="wrap" gap={0.75}>
                {gifUrls.map((u, idx) => (
                  <Box key={idx} sx={{ lineHeight: 0 }}>
                    <img
                      src={u}
                      alt="GIF"
                      loading="lazy"
                      style={{ maxWidth: 180, borderRadius: 8, display: 'block' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
            {!remainingText && gifUrls.length === 0 && (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{rawText}</Typography>
            )}
          </Box>
        )}
      </Box>
      {canEdit && !isEditing && (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title="Edit" arrow>
            <IconButton size="small" onClick={() => onStartEdit && onStartEdit(commentId, text)} aria-label="Edit comment">
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" onClick={() => onDelete && onDelete(commentId)} color="error" aria-label="Delete comment">
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default Comment;
