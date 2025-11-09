# Setting Up Cloudinary for MERN Social

This guide will walk you through the process of setting up Cloudinary for your MERN Social application.

## Step 1: Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

## Step 2: Get Your API Credentials

1. In your Cloudinary dashboard, look for the "Account Details" section
2. Note down the following values:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## Step 3: Configure Your Server

1. Create a `.env` file in your server directory (if it doesn't exist)
2. Add the following Cloudinary-specific configuration:

```
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Enable cloud storage
USE_CLOUD_STORAGE=true
```

3. Replace the placeholder values with your actual Cloudinary credentials

## Step 4: Rename the Prepared Files

1. Rename `index.js.cloudinary` to `index.js`:

```bash
mv index.js index.js.backup
mv index.js.cloudinary index.js
```

## Step 5: Run the Migration Script

1. Start your MongoDB database if it's not already running
2. Run the migration script to upload existing files to Cloudinary:

```bash
node scripts/migrate-to-cloudinary.js
```

3. This script will:
   - Upload all files in `public/assets` to your Cloudinary account
   - Update the database to reference the Cloudinary URLs
   - Print a summary of the migration

## Step 6: Verify the Setup

1. After the migration, restart your server:

```bash
npm run dev
```

2. Test that existing media files are displayed correctly
3. Test uploading a new image or video post

## Step 7: Cleanup (Optional)

After verifying that all media is correctly stored in Cloudinary and being displayed properly in your app, you can optionally clean up the local files:

```bash
# Backup the files first (optional)
mkdir -p backup/assets
cp public/assets/* backup/assets/

# Remove the files from public/assets
rm public/assets/*
```

## Troubleshooting

- If images aren't displaying, check the network tab in your browser's developer tools to see the URLs being requested
- If uploads fail, verify your Cloudinary credentials in the .env file
- If the migration script fails with connection errors, ensure MongoDB is running

## Cloudinary Features to Explore

Cloudinary offers many features that can enhance your application:

1. **Image transformations**: Resize, crop, and optimize images on-the-fly
2. **Video transformations**: Transcode and optimize videos
3. **Responsive images**: Automatically deliver the right size for each device
4. **Content moderation**: Filter inappropriate content
5. **Advanced search**: Find media by content, colors, and more

To use these features, explore the [Cloudinary documentation](https://cloudinary.com/documentation).