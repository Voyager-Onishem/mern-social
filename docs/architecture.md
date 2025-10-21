# MERN Social - System Architecture

## Overview

MERN Social is a full-stack web application built with the MERN stack, implementing a modern social media platform with real-time capabilities and cloud storage integration.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Express API    │◄──►│   MongoDB       │
│   (Frontend)    │    │  (Backend)      │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Material-UI    │    │   JWT Auth      │    │   Mongoose      │
│  Redux Toolkit  │    │   Multer        │    │   ODM           │
│  SSE Client     │    │   Cloudinary    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (Client)
- **Framework**: React 18 with functional components and hooks
- **UI Library**: Material-UI (MUI) v5 with Emotion styling
- **State Management**: Redux Toolkit with Redux Persist
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (via custom apiClient utility)
- **Forms**: Formik with Yup validation
- **Real-time**: Server-Sent Events (SSE) with polling fallback
- **Build Tool**: Create React App with custom service worker

### Backend (Server)
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer with storage abstraction
- **Validation**: Express middleware with custom validators
- **Logging**: Morgan HTTP request logger
- **Security**: Helmet security headers
- **CORS**: Configurable cross-origin resource sharing

### Database
- **Primary**: MongoDB Atlas (cloud) with automatic local fallback
- **ODM**: Mongoose with schema validation
- **Backup**: MongoDB Memory Server for testing
- **Indexing**: Optimized queries for users, posts, and search

### Infrastructure
- **Storage**: Dual system (local files + Cloudinary integration)
- **Environment**: dotenv configuration management
- **Process Management**: PM2 for production deployment
- **Monitoring**: Basic error logging and health checks

## Component Architecture

### Frontend Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── AnimatedLikeButton.jsx
│   ├── Comment.jsx
│   ├── Friend.jsx
│   ├── ImageUploader.jsx
│   ├── GiphyPicker.jsx
│   └── ...
├── scenes/             # Page-level components
│   ├── homePage/
│   ├── loginPage/
│   ├── profilePage/
│   └── ...
├── state/              # Redux state management
│   ├── store.js
│   ├── index.js
│   └── adsSlice.js
├── api/                # API integration layer
│   ├── giphyApi.js
│   └── searchApi.js
├── utils/              # Utility functions
│   ├── apiClient.js
│   ├── mediaHelpers.js
│   ├── timeAgo.js
│   └── ...
└── theme.js           # MUI theme configuration
```

### Backend Structure

```
server/
├── controllers/        # Business logic layer
│   ├── auth.js
│   ├── posts.js
│   ├── users.js
│   ├── search.js
│   └── analytics.js
├── models/            # Data models
│   ├── User.js
│   ├── Post.js
│   └── ...
├── routes/            # API route definitions
│   ├── auth.js
│   ├── posts.js
│   ├── users.js
│   ├── search.js
│   └── analytics.js
├── middleware/        # Express middleware
│   └── auth.js
├── config/            # Configuration files
│   └── cloudStorage.js
├── data/              # Seed data
│   └── index.js
└── index.js          # Application entry point
```

## Data Models

### User Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  picturePath: String,
  friends: Array,
  location: String,
  occupation: String,
  role: String,
  twitterUrl: String,
  linkedinUrl: String,
  viewedProfile: Number,
  impressions: Number,
  profileViewsTotal: Number,
  timestamps: true
}
```

### Post Model
```javascript
{
  userId: String (required),
  firstName: String (required),
  lastName: String (required),
  location: String,
  locationData: {
    latitude: Number,
    longitude: Number
  },
  description: String,
  picturePath: String,
  userPicturePath: String,
  audioPath: String,
  mediaPaths: [String],
  likes: Map,
  comments: [{
    userId: String,
    username: String,
    userPicturePath: String,
    text: String,
    createdAt: Date,
    editedAt: Date
  }],
  impressions: Number,
  timestamps: true
}
```

## API Architecture

### RESTful Endpoints

#### Authentication (`/auth`)
- `POST /auth/register` - User registration with file upload
- `POST /auth/login` - User authentication
- `GET /auth/test` - Connection test (public)
- `GET /auth/test-auth` - Auth test (protected)

#### Users (`/users`)
- `GET /users/:id` - Get user profile
- `GET /users/:id/friends` - Get user's friends
- `PATCH /users/:id/:friendId` - Add/remove friend
- `PATCH /users/:id` - Update profile with picture

#### Posts (`/posts`)
- `GET /posts` - Get feed posts
- `GET /posts/:userId/posts` - Get user's posts
- `GET /posts/:id` - Get single post
- `POST /posts` - Create new post with media
- `PATCH /posts/:id/like` - Like/unlike post
- `PATCH /posts/:id/comment` - Add comment
- `PATCH /posts/:id/comment/edit` - Edit comment
- `PATCH /posts/:id/comment/delete` - Delete comment

#### Search (`/search`)
- `GET /search` - Search users and posts

#### Analytics (`/analytics`)
- `POST /analytics/profile-view` - Record profile view
- `POST /analytics/post-impressions` - Record post impressions
- `GET /analytics/post/:id/summary` - Get post analytics
- `GET /analytics/profile/:id/summary` - Get profile analytics

### Real-time Architecture

#### Server-Sent Events (SSE)
- **Endpoint**: `GET /realtime`
- **Authentication**: JWT required
- **Events**:
  - `comment:add` - New comment on post
  - `like:add` - Post liked
  - `like:remove` - Post unliked
  - `post:new` - New post in feed
- **Fallback**: HTTP polling when SSE fails
- **Connection Management**: Auto-reconnect with exponential backoff

## Storage Architecture

### Dual Storage System

#### Local Storage (Default)
- **Location**: `server/public/assets/`
- **Features**:
  - Direct file system access
  - No external dependencies
  - Fast local development
- **Limitations**:
  - Not scalable for production
  - No CDN benefits
  - Manual backup required

#### Cloud Storage (Cloudinary)
- **Configuration**: Environment variable `USE_CLOUD_STORAGE=true`
- **Features**:
  - Global CDN delivery
  - Automatic format optimization
  - Video streaming support
  - Scalable storage
- **Integration**:
  - Multer storage adapter
  - Automatic URL generation
  - Fallback to local storage

### File Processing Pipeline

1. **Upload Reception**: Multer handles multipart/form-data
2. **Validation**: File type and size checking
3. **Storage**: Local or cloud storage based on configuration
4. **URL Generation**: Public URL creation for client access
5. **Database Update**: Store URL in user/post document

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with expiration
- **Password Hashing**: bcrypt with salt rounds
- **Route Protection**: Middleware verification for sensitive endpoints
- **CORS Configuration**: Domain-restricted cross-origin requests

### Data Protection
- **Input Validation**: Schema validation and sanitization
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization and CSP headers
- **File Upload Security**: Type validation and size limits

### Infrastructure Security
- **Environment Variables**: Sensitive data in .env files
- **Error Handling**: No sensitive data in error responses
- **Logging**: Request logging without sensitive information
- **Headers**: Security headers via Helmet middleware

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Progressive loading and compression
- **Caching**: Redux persist for state, browser caching for assets
- **Bundle Analysis**: Webpack bundle analyzer integration

### Backend Optimization
- **Database Indexing**: Optimized queries for users, posts, search
- **Connection Pooling**: MongoDB connection reuse
- **Caching**: Static asset caching with appropriate headers
- **Compression**: Response compression for API payloads

### Real-time Performance
- **Connection Limits**: SSE connection management
- **Event Filtering**: Targeted broadcasts to reduce server load
- **Polling Optimization**: Adaptive intervals based on connection status
- **Memory Management**: EventEmitter cleanup and leak prevention

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: No server-side session storage
- **Database Sharding**: MongoDB Atlas auto-sharding
- **CDN Integration**: Cloudinary for global asset delivery
- **Load Balancing**: Nginx reverse proxy configuration

### Database Scaling
- **Read Replicas**: MongoDB Atlas read distribution
- **Indexing Strategy**: Compound indexes for complex queries
- **Query Optimization**: Aggregation pipelines for analytics
- **Backup Strategy**: Automated snapshots and point-in-time recovery

### Monitoring & Observability
- **Health Checks**: API endpoints for service monitoring
- **Error Tracking**: Centralized error logging
- **Performance Metrics**: Response time and throughput monitoring
- **User Analytics**: Engagement and usage pattern tracking

## Deployment Architecture

### Development Environment
- **Local MongoDB**: Fallback when Atlas unavailable
- **In-memory DB**: Testing with MongoDB Memory Server
- **Hot Reload**: Nodemon for server, CRA for client
- **Debug Tools**: Redux DevTools, React DevTools

### Production Environment
- **Containerization**: Docker support planned
- **Process Management**: PM2 clustering
- **Reverse Proxy**: Nginx for static files and SSL
- **Environment Config**: Production-optimized settings

### CI/CD Pipeline
- **Automated Testing**: Unit and integration tests
- **Build Optimization**: Production builds with minification
- **Asset Optimization**: Image compression and CDN deployment
- **Rollback Strategy**: Quick rollback capabilities

## Future Architecture Evolution

### Microservices Migration
- **Service Decomposition**: Separate auth, posts, users services
- **API Gateway**: Centralized request routing and authentication
- **Event-Driven Architecture**: Message queues for inter-service communication
- **Database Partitioning**: Service-specific database instances

### Advanced Features
- **GraphQL API**: Flexible query capabilities
- **WebSocket Support**: Bidirectional real-time communication
- **Machine Learning**: Content recommendation and moderation
- **Multi-region Deployment**: Global user base support

### Performance Enhancements
- **Edge Computing**: CDN-based computation
- **Caching Layers**: Redis for session and data caching
- **Database Optimization**: Read/write splitting and query optimization
- **Monitoring Stack**: ELK stack for comprehensive observability