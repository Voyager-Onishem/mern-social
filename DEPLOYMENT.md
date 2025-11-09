# MERN Social App - Deployment Guide

This guide covers deploying the MERN Social application to production using various platforms.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Options](#deployment-options)
   - [Render (Recommended - Free Tier)](#option-1-render-recommended)
   - [Railway](#option-2-railway)
   - [Heroku](#option-3-heroku)
   - [DigitalOcean App Platform](#option-4-digitalocean)
   - [AWS (EC2 + S3)](#option-5-aws)
   - [Docker Deployment](#option-6-docker)
4. [Database Setup](#database-setup)
5. [Cloud Storage Setup](#cloud-storage-setup)
6. [Post-Deployment](#post-deployment)

---

## Prerequisites

✅ **Required:**
- Node.js 18+ installed locally
- MongoDB Atlas account (free tier available)
- Cloudinary account (for media storage)
- Git repository (GitHub, GitLab, or Bitbucket)

✅ **Optional:**
- Domain name (for custom URL)
- SSL certificate (most platforms provide free SSL)

---

## Environment Variables

### Server Environment Variables (.env)

```env
# Required
NODE_ENV=production
PORT=6001
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/mern-social
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (Required for media)
USE_CLOUD_STORAGE=true
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Client URL (CORS)
CLIENT_URL=https://your-frontend-domain.com

# Optional
DB_CONNECTION_TIMEOUT=10000
ALLOW_DB_FALLBACK=false
MAX_FILE_SIZE_MB=25
MAX_MEDIA_FILES=5
```

### Client Environment Variables (.env)

```env
# Required
REACT_APP_API_URL=https://your-backend-domain.com

# Optional
REACT_APP_ENVIRONMENT=production
```

---

## Deployment Options

### Option 1: Render (Recommended)

**✅ Pros:** Free tier, easy setup, auto-deploy from Git  
**⚠️ Cons:** Free tier spins down after inactivity

#### Backend Deployment (Render)

1. **Create Render Account**
   - Sign up at https://render.com

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   ```
   Name: mern-social-backend
   Region: Choose closest to your users
   Branch: master
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   - Go to "Environment" tab
   - Add all server environment variables (see above)
   - **Important:** Set `NODE_ENV=production`

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Copy the service URL (e.g., `https://mern-social-backend.onrender.com`)

#### Frontend Deployment (Render)

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect same repository

2. **Configure Site**
   ```
   Name: mern-social-frontend
   Branch: master
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build (5-10 minutes)

5. **Update Backend CORS**
   - Go to backend service environment variables
   - Update `CLIENT_URL` to your frontend URL
   - Trigger manual redeploy

---

### Option 2: Railway

**✅ Pros:** Simple, $5 free credit monthly  
**⚠️ Cons:** Requires credit card

#### Steps:

1. **Sign up at Railway.app**
   - https://railway.app

2. **Create New Project**
   - "New Project" → "Deploy from GitHub repo"

3. **Deploy Backend**
   ```
   Root Directory: /server
   Start Command: npm start
   ```

4. **Deploy Frontend**
   ```
   Root Directory: /client
   Build Command: npm run build
   Start Command: npx serve -s build -l $PORT
   ```

5. **Set Environment Variables** in Railway dashboard

6. **Generate Domains** for both services

---

### Option 3: Heroku

**⚠️ Note:** Heroku ended free tier in 2022. Paid plans start at $7/month.

#### Backend Deployment:

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd server
heroku create mern-social-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URL=your-mongodb-url
heroku config:set JWT_SECRET=your-secret
heroku config:set USE_CLOUD_STORAGE=true
heroku config:set CLOUDINARY_CLOUD_NAME=your-name
heroku config:set CLOUDINARY_API_KEY=your-key
heroku config:set CLOUDINARY_API_SECRET=your-secret
heroku config:set CLIENT_URL=https://your-frontend.herokuapp.com

# Deploy
git push heroku master

# Check logs
heroku logs --tail
```

#### Frontend Deployment:

```bash
cd client
heroku create mern-social-frontend

# Add buildpack
heroku buildpacks:set mars/create-react-app

# Set API URL
heroku config:set REACT_APP_API_URL=https://your-backend.herokuapp.com

# Deploy
git push heroku master
```

---

### Option 4: DigitalOcean App Platform

**✅ Pros:** Reliable, $5/month tier  
**⚠️ Cons:** No free tier

1. **Sign up at DigitalOcean**
   - https://www.digitalocean.com/products/app-platform

2. **Create App**
   - "Apps" → "Create App"
   - Connect GitHub repo

3. **Configure Components**

**Backend:**
```
Name: backend
Type: Web Service
Source Directory: /server
Build Command: npm install
Run Command: npm start
HTTP Port: 6001
Instance Size: Basic ($5/month)
```

**Frontend:**
```
Name: frontend
Type: Static Site
Source Directory: /client
Build Command: npm run build
Output Directory: build
```

4. **Set Environment Variables** for each component

5. **Deploy**

---

### Option 5: AWS (Full Control)

**✅ Pros:** Full control, scalable  
**⚠️ Cons:** Complex setup, requires AWS knowledge

#### Architecture:
- EC2 for backend
- S3 + CloudFront for frontend
- RDS or MongoDB Atlas for database
- S3 for media (or use Cloudinary)

#### Quick Setup:

1. **Launch EC2 Instance**
   ```bash
   # Amazon Linux 2 or Ubuntu
   # Install Node.js 18+
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   
   # Clone repository
   git clone https://github.com/your-username/mern-social.git
   cd mern-social/server
   npm install
   
   # Set environment variables
   sudo nano /etc/environment
   # Add all variables
   
   # Install PM2
   sudo npm install -g pm2
   pm2 start index.js --name mern-social
   pm2 startup
   pm2 save
   ```

2. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:6001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Deploy Frontend to S3**
   ```bash
   cd client
   npm run build
   
   # Upload to S3
   aws s3 sync build/ s3://your-bucket-name --delete
   
   # Configure CloudFront for CDN (optional)
   ```

---

### Option 6: Docker Deployment

Create deployment files:

#### `server/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 6001

CMD ["node", "index.js"]
```

#### `client/Dockerfile`
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### `client/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### `docker-compose.yml` (root directory)
```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "6001:6001"
    environment:
      - NODE_ENV=production
      - MONGO_URL=${MONGO_URL}
      - JWT_SECRET=${JWT_SECRET}
      - USE_CLOUD_STORAGE=true
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - CLIENT_URL=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: ./client
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:6001
    depends_on:
      - backend
    restart: unless-stopped
```

**Deploy with Docker:**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Sign up at https://www.mongodb.com/cloud/atlas

2. **Create Cluster**
   - Choose "Shared" (Free tier)
   - Select region closest to your app
   - Name: `mern-social-prod`

3. **Create Database User**
   - Database Access → Add New User
   - Username: `mern-social-user`
   - Password: (Generate strong password)
   - Role: Atlas Admin

4. **Configure Network Access**
   - Network Access → Add IP Address
   - For production: Add your server's IP
   - For testing: Allow Access from Anywhere (0.0.0.0/0)
   - ⚠️ **Security:** Restrict IPs in production!

5. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `mern-social`

**Example:**
```
mongodb+srv://mern-social-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mern-social?retryWrites=true&w=majority
```

---

## Cloud Storage Setup

### Cloudinary (Recommended)

1. **Create Account**
   - Sign up at https://cloudinary.com (Free tier: 25GB)

2. **Get Credentials**
   - Dashboard → Account Details
   - Copy:
     - Cloud Name
     - API Key
     - API Secret

3. **Configure Upload Presets** (Optional)
   - Settings → Upload → Upload presets
   - Create preset for social media images
   - Enable unsigned uploads if needed

4. **Set Environment Variables**
   ```env
   USE_CLOUD_STORAGE=true
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

---

## Post-Deployment

### 1. Health Check
```bash
# Check backend health
curl https://your-backend-url.com/health

# Expected response:
{
  "status": "healthy",
  "database": { "connected": true, "type": "atlas" }
}
```

### 2. Test Key Features
- ✅ User registration
- ✅ Login/logout
- ✅ Create post with image
- ✅ Like/unlike posts
- ✅ Add comments
- ✅ Real-time updates (Socket.io)
- ✅ Search functionality

### 3. Monitor Logs
```bash
# Render: View logs in dashboard
# Heroku: heroku logs --tail
# Railway: railway logs
# AWS: Check CloudWatch or PM2 logs
```

### 4. Performance Optimization

**Enable Gzip Compression** (server/index.js):
```javascript
import compression from 'compression';
app.use(compression());
```

**Add Caching Headers:**
```javascript
app.use('/public', express.static('public', {
  maxAge: '1y',
  etag: true
}));
```

**Frontend Build Optimization:**
```bash
# Already optimized by react-scripts build
npm run build
# Creates optimized production build
```

### 5. Security Checklist

✅ **Environment Variables:**
- Never commit `.env` files
- Use platform secrets management
- Rotate secrets regularly

✅ **Database:**
- Restrict IP access
- Use strong passwords
- Enable MongoDB encryption at rest

✅ **API:**
- CORS configured correctly
- Rate limiting enabled
- JWT secrets are strong

✅ **HTTPS:**
- Ensure SSL/TLS enabled
- Redirect HTTP to HTTPS

### 6. Monitoring Setup

**Add Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- StatusCake

**Error Tracking:**
```javascript
// Optional: Add Sentry or similar
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Common Issues

**1. Backend won't start:**
```bash
# Check logs for errors
# Verify environment variables
# Test MongoDB connection
```

**2. Frontend can't connect to backend:**
```bash
# Check REACT_APP_API_URL is correct
# Verify CORS settings
# Test backend /health endpoint
```

**3. Images not uploading:**
```bash
# Verify Cloudinary credentials
# Check USE_CLOUD_STORAGE=true
# Test with smaller images first
```

**4. Socket.io not working:**
```bash
# Ensure WebSocket support on platform
# Check CORS includes Socket.io
# Verify CLIENT_URL is correct
```

**5. Database connection fails:**
```bash
# Check MONGO_URL format
# Verify network access in MongoDB Atlas
# Test connection locally first
```

---

## Cost Estimate

### Free Tier (Month 1-12)
- **Render:** Free
- **MongoDB Atlas:** Free (512MB)
- **Cloudinary:** Free (25GB)
- **Total:** $0/month

### Paid Tier (After scaling)
- **Render:** $7/month (backend)
- **Render Static:** Free (frontend)
- **MongoDB Atlas:** $9/month (Dedicated M2)
- **Cloudinary:** Free (or $89/month for Plus)
- **Total:** ~$16/month minimum

---

## Need Help?

- Check `/health` endpoint for backend status
- Review server logs for errors
- Test locally with production env vars
- Check firewall/security group settings

**Success!** 🎉 Your MERN Social app should now be live!
