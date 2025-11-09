# MongoDB Connection Troubleshooting

## Issue: MongoDB Atlas Connection Error

You're experiencing the following error:
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Quick Solutions

### Option 1: Run the automated check script
```powershell
cd server
./check-mongo-connection.ps1
```
This will tell you your current IP address and guide you through the process.

### Option 2: Use the local MongoDB fallback (automatic)
The server has been updated to automatically fall back to:
1. Local MongoDB (if installed) 
2. In-memory MongoDB (if local MongoDB is not available)

Just restart the server normally:
```
npm run dev
```

### Option 3: Use local MongoDB explicitly 
```
npm run local
```

## Manual Steps to Fix MongoDB Atlas Connection

1. **Login to MongoDB Atlas**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Sign in with your credentials

2. **Navigate to Network Access**
   - Select your project
   - Click on "Network Access" in the security section

3. **Add Your Current IP**
   - Click "Add IP Address"
   - Choose "Add Current IP Address" or manually enter your IP
   - Add a comment like "Home Office" or "Development Machine"
   - Click "Confirm"

4. **Wait for the Change to Propagate**
   - Changes may take 1-2 minutes to apply

5. **Restart Your Server**
   ```
   npm run dev
   ```

## Verify Connection Status
To check if your MongoDB connection is working:
```
npm run check-db
```

## Need More Help?
If you're still experiencing issues:
1. Check your MongoDB Atlas username and password in the `.env` file
2. Make sure your Atlas cluster hasn't been paused or deleted
3. Try connecting from a different network to rule out network restrictions