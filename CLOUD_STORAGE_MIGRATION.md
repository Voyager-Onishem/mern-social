# Migrating to Cloud Storage

This guide will help you migrate your media files from local disk storage to a cloud storage provider such as Amazon S3, Azure Blob Storage, or Cloudinary.

## Why Move to Cloud Storage?

- **Scalability**: Cloud storage can scale to handle large volumes of data
- **Reliability**: Cloud providers offer redundancy and high availability
- **Performance**: CDN integration for faster delivery worldwide
- **Cost-effectiveness**: Pay-as-you-go pricing, no need to manage your own storage infrastructure
- **Security**: Built-in security features and access controls

## Prerequisites

1. Choose a cloud storage provider (AWS S3, Azure Blob Storage, or Cloudinary)
2. Create an account and set up your storage container/bucket
3. Obtain your API credentials
4. Install the required dependencies for your chosen provider:

```bash
# For AWS S3
npm install @aws-sdk/client-s3 multer-s3

# For Azure Blob Storage
npm install @azure/storage-blob multer-azure-storage

# For Cloudinary
npm install cloudinary multer-storage-cloudinary
```

## Step 1: Configure Environment Variables

1. Copy the `.env.template` file to `.env` in your server directory
2. Fill in the environment variables for your chosen cloud storage provider
3. Set `USE_CLOUD_STORAGE=true`

## Step 2: Run the Migration Script

The migration script will:
1. Upload all existing files from `server/public/assets` to your cloud storage
2. Update the database references to point to the cloud URLs

```bash
node scripts/migrate-to-cloud-storage.js
```

**Note**: Before running the migration script, make sure to uncomment the relevant section for your chosen cloud provider in the script.

## Step 3: Use the Cloud Storage Configuration

1. The application is already configured to use cloud storage when `USE_CLOUD_STORAGE=true`
2. New uploads will automatically go to the cloud storage
3. Existing URLs in the database will be updated to point to the cloud storage

## Step 4: Verify the Migration

1. Check that the media files are properly displayed in the application
2. Verify that new uploads are stored in the cloud storage
3. Once you're satisfied that everything is working correctly, you can remove the local files from `server/public/assets` to save disk space

## Troubleshooting

- If images are not displaying correctly, check the URLs in the database and ensure they're accessible
- If uploads fail, check your cloud storage configuration and API credentials
- If the migration script fails, check the error messages and ensure you have the correct permissions

## Rollback Plan

If you encounter issues with cloud storage:

1. Set `USE_CLOUD_STORAGE=false` in your `.env` file
2. The application will fall back to local storage
3. You may need to run a script to download files from the cloud and restore local references

## Cloud Provider-Specific Notes

### Amazon S3

- Make sure your bucket has the correct CORS configuration to allow uploads and serving files
- Consider setting up CloudFront CDN for better performance

### Azure Blob Storage

- Ensure your container has the correct access level (typically "Blob" for public access)
- Consider setting up Azure CDN for better performance

### Cloudinary

- Cloudinary automatically optimizes images and provides transformations
- Take advantage of Cloudinary's image/video manipulation APIs for additional features