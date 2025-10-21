import { Box } from "@mui/material";
import { getMediaUrl } from "../utils/mediaHelpers";

const UserImage = ({ image, size = "60px" }) => {
  return (
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
        src={getMediaUrl(image)}
      />
    </Box>
  );
};

export default UserImage;
