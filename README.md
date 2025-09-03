# MERN Social

## GIF support setup

To enable the Giphy picker, create a client/.env file with:

```
REACT_APP_GIPHY_API_KEY=your_giphy_api_key_here
```

Then restart the React dev server. The GIF button in comments opens a picker (MUI Dialog) that searches Giphy and inserts the selected GIF URL into your comment.

# FullStack Social Media App

Build a COMPLETE Fullstack Responsive MERN App with Auth, Likes, Dark Mode | React, MongoDB, MUI

Video: https://www.youtube.com/watch?v=K8YELRmUb5o

For all related questions and discussions about this project, check out the discord: https://discord.gg/2FfPeEk2mX

## To do later

- Move uploads off local disk to object storage/CDN (e.g., Cloudinary, Amazon S3 + CloudFront, Azure Blob Storage):
	- Server: stream uploads directly to provider; store returned public URL in `picturePath` instead of a local filename.
	- Client: no change required if `picturePath` is a full URL; keep rendering from `picturePath`.
	- Access control: if needed, sign URLs or use secured delivery for private assets.
	- Migration: optionally copy existing `public/assets` files to the provider and backfill `picturePath` values.
	- Observability: add basic error handling and logging around provider SDK calls.
