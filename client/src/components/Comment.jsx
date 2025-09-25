import { Box, Typography, Avatar, IconButton, TextField, Tooltip } from "@mui/material";
import { EditOutlined, DeleteOutline, SaveOutlined, Close } from "@mui/icons-material";
import { extractFirstGiphyUrl } from "utils/isGiphyUrl";
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
  const gifUrl = extractFirstGiphyUrl(rawText);
  const remainingText = gifUrl ? rawText.replace(gifUrl, "").trim() : rawText;
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
            <Typography variant="caption" color="text.secondary">
              {displayDate}{editedAt ? ' (edited)' : ''}
            </Typography>
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
                  >
                    <SaveOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancel" arrow>
                <IconButton size="small" onClick={onCancelEdit}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <>
            {gifUrl ? (
              <>
                {remainingText && (
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{remainingText}</Typography>
                )}
                <img src={gifUrl} alt={"GIF"} style={{ maxWidth: 180, borderRadius: 8, marginTop: 4 }} />
              </>
            ) : (
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{text}</Typography>
            )}
          </>
        )}
      </Box>
      {canEdit && !isEditing && (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title="Edit" arrow>
            <IconButton size="small" onClick={() => onStartEdit && onStartEdit(commentId, text)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" onClick={() => onDelete && onDelete(commentId)} color="error">
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default Comment;
