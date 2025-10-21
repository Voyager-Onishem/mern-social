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

---

# Architecture Review for Brownfield Enhancements

## Overview

This section provides an architectural analysis and integration plan for the remaining MERN Social platform enhancements identified in the Brownfield Enhancement PRD. The review focuses on how new features will integrate with the existing MERN stack architecture while maintaining system stability and performance.

## Enhancement Analysis

### 1. Advanced Search and Filtering

#### Current Architecture Impact
- **Existing Search**: Basic text-based search via `/search` endpoint using MongoDB regex queries
- **Database**: MongoDB with Mongoose ODM, current indexing on basic fields
- **Frontend**: Simple text input with results display in SearchResultsWidget

#### Proposed Architecture Changes

**Backend Enhancements:**
```
Search Controller (Enhanced)
├── Basic Text Search (existing)
├── Advanced Filters
│   ├── Date Range Queries
│   ├── Media Type Filtering
│   ├── Engagement Metrics
│   └── Location-based Search
├── Pagination & Sorting
└── Query Optimization
```

**Database Schema Updates:**
```javascript
// Enhanced Post indexes
Post.collection.createIndex({
  createdAt: -1,
  mediaPaths: 1,
  likes: 1,
  comments: 1
});

// User search indexes
User.collection.createIndex({
  location: "2dsphere",
  occupation: 1,
  createdAt: -1
});
```

**API Endpoint Extensions:**
```javascript
// Enhanced search endpoint
GET /search/advanced?query=text&filters={
  dateFrom: "2025-01-01",
  dateTo: "2025-12-31",
  mediaTypes: ["image", "video"],
  engagement: { minLikes: 10, minComments: 5 },
  location: { lat: 40.7128, lng: -74.0060, radius: 50 },
  sortBy: "engagement",
  page: 1,
  limit: 20
}
```

#### Integration Strategy
- **Backward Compatibility**: Existing `/search` endpoint remains unchanged
- **Progressive Enhancement**: New `/search/advanced` endpoint for enhanced features
- **Database Migration**: Add compound indexes without downtime
- **Caching**: Redis integration for frequently accessed search results

### 2. Real-time Notifications System

#### Current Architecture Impact
- **Existing SSE**: `/realtime` endpoint with 4 event types (post:new, like:add/remove, comment:add)
- **Client Integration**: Redux updates via SSE event handling
- **Connection Management**: Auto-reconnect with exponential backoff

#### Proposed Architecture Changes

**Notification Data Model:**
```javascript
// New Notification model
{
  userId: String (required),
  type: String (enum: ['like', 'comment', 'friend_request', 'mention']),
  title: String,
  message: String,
  relatedPostId: String,
  relatedUserId: String,
  isRead: { type: Boolean, default: false },
  createdAt: Date,
  expiresAt: Date // For auto-cleanup
}
```

**Enhanced SSE Architecture:**
```
Real-time System (Enhanced)
├── Feed Updates (existing)
├── Notifications
│   ├── User-specific Events
│   ├── Preference-based Filtering
│   ├── Bulk Operations
│   └── Push Notifications
└── Connection Management
    ├── Selective Subscriptions
    ├── Presence Indicators
    └── Typing Indicators (future)
```

**Database Schema:**
```javascript
// Notification indexes
Notification.collection.createIndex({
  userId: 1,
  isRead: 1,
  createdAt: -1
});

// User preferences extension
User.schema.add({
  notificationPreferences: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true }
  },
  notificationsLastRead: Date
});
```

#### Integration Strategy
- **Database Extension**: Add Notification model with TTL indexes
- **SSE Enhancement**: Extend existing event system with user-specific notifications
- **Client State**: Add notification slice to Redux store
- **UI Integration**: Notification panel in navbar with unread count

### 3. Complete Cloud Storage Migration

#### Current Architecture Impact
- **Dual Storage**: Local files + Cloudinary integration via `USE_CLOUD_STORAGE` flag
- **Configuration**: Environment-based storage selection
- **Migration**: Partial implementation with CloudStorageModal

#### Proposed Architecture Changes

**Unified Storage Abstraction:**
```
Storage System (Enhanced)
├── Storage Strategy
│   ├── Primary: Cloud Storage (Cloudinary)
│   ├── Fallback: Local Storage
│   └── Migration: Background Process
├── Upload Pipeline
│   ├── Validation & Processing
│   ├── CDN Optimization
│   └── URL Generation
└── Migration Tools
    ├── Batch Migration Script
    ├── Progress Tracking
    └── Rollback Capability
```

**Migration Architecture:**
```javascript
// Migration controller
class StorageMigration {
  async migrateUserAssets(userId) {
    // 1. Get all user-related assets
    // 2. Upload to cloud storage
    // 3. Update database URLs
    // 4. Verify and cleanup local files
  }
  
  async migratePostAssets(postId) {
    // Similar process for post media
  }
  
  async batchMigrate(options) {
    // Background migration with progress tracking
  }
}
```

**Configuration Management:**
```javascript
// Enhanced storage configuration
const storageConfig = {
  primary: process.env.STORAGE_PROVIDER || 'cloudinary',
  providers: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    local: {
      uploadPath: './server/public/assets',
      baseUrl: process.env.API_URL || 'http://localhost:6001'
    }
  },
  migration: {
    batchSize: 10,
    concurrency: 3,
    retryAttempts: 3
  }
};
```

#### Integration Strategy
- **Zero Downtime**: Migration runs in background without affecting active users
- **Fallback System**: Automatic fallback to local storage on cloud failures
- **Monitoring**: Migration progress tracking and error reporting
- **Cost Optimization**: CDN usage analytics and optimization

### 4. Enhanced Accessibility & Performance

#### Current Architecture Impact
- **Existing Accessibility**: ARIA labels on interactive elements
- **Performance**: Basic optimizations with lazy loading and caching

#### Proposed Architecture Changes

**Accessibility Enhancements:**
```
Accessibility Layer
├── ARIA Enhancements
│   ├── Comprehensive Labels
│   ├── Live Regions for Updates
│   ├── Focus Management
│   └── Keyboard Navigation
├── Screen Reader Support
│   ├── Semantic HTML Structure
│   ├── Skip Links
│   └── Alternative Text
└── High Contrast Support
    ├── Theme Extensions
    ├── Color Contrast Validation
    └── User Preferences
```

**Performance Optimizations:**
```
Performance Layer
├── Frontend Optimizations
│   ├── Virtual Scrolling for Lists
│   ├── Image Optimization Pipeline
│   ├── Bundle Splitting
│   └── Service Worker Caching
├── Backend Optimizations
│   ├── Database Query Optimization
│   ├── Response Compression
│   ├── Connection Pooling
│   └── Caching Strategy
└── Real-time Performance
    ├── Event Batching
    ├── Selective Broadcasting
    └── Connection Limits
```

#### Integration Strategy
- **Progressive Enhancement**: Accessibility features don't break existing functionality
- **Performance Monitoring**: Add performance metrics and alerting
- **User Preferences**: Allow users to customize accessibility settings
- **Testing**: Automated accessibility testing in CI/CD pipeline

## Integration Architecture

### Component Integration Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Enhanced)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Search      │ │ Notification│ │ Cloud       │ │ A11y    │ │
│  │ Components  │ │ Components  │ │ Components │ │ Layer   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Redux Store (Enhanced)                      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│  │  │ Search      │ │ Notification│ │ User        │         │ │
│  │  │ State       │ │ State       │ │ Preferences │         │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬─────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express API (Enhanced)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Advanced    │ │ Notification│ │ Storage     │ │ Perf.   │ │
│  │ Search API  │ │ API         │ │ Migration   │ │ APIs    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Database Layer (Enhanced)                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │
│  │  │ Search      │ │ Notification│ │ Migration   │         │ │
│  │  │ Indexes     │ │ Collections │ │ Tracking    │         │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

**Advanced Search Flow:**
```
User Input → Search Component → API Call → Database Query → Results → UI Update
     ↓             ↓              ↓          ↓            ↓        ↓
  Validation   State Update   Filtering   Indexing    Sorting  Rendering
```

**Notification Flow:**
```
Event Trigger → SSE Broadcast → Client Receive → State Update → UI Notification
     ↓             ↓              ↓              ↓            ↓
  Validation   User Filtering  Redux Update   Badge Update  Sound/Vibration
```

**Storage Migration Flow:**
```
Migration Trigger → Asset Discovery → Cloud Upload → DB Update → Local Cleanup
      ↓                ↓                ↓            ↓            ↓
  Scheduling      Batch Processing  Progress Track  URL Update   Verification
```

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Database query performance degradation | High | Add indexes, query optimization, monitoring |
| SSE connection overload | Medium | Event batching, selective broadcasting, connection limits |
| Storage migration data loss | Critical | Comprehensive testing, rollback capability, backups |
| Accessibility regression | Medium | Automated testing, manual QA, user feedback |

### Integration Risks

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Breaking existing API contracts | High | Backward compatibility, comprehensive testing |
| UI component conflicts | Medium | Component isolation, gradual rollout |
| Real-time event conflicts | Medium | Event versioning, client compatibility checks |
| Performance regression | Medium | Performance monitoring, A/B testing |

## Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
1. **Database Schema Updates**: Add indexes and new collections
2. **API Extensions**: Implement enhanced endpoints
3. **Basic UI Components**: Search filters, notification panel
4. **Storage Abstraction**: Unified storage interface

### Phase 2: Core Features (3-4 weeks)
1. **Advanced Search Implementation**: Filters, pagination, sorting
2. **Notification System**: Real-time notifications with preferences
3. **Cloud Migration Tools**: Migration scripts and monitoring
4. **Accessibility Enhancements**: ARIA improvements, keyboard navigation

### Phase 3: Optimization & Testing (2-3 weeks)
1. **Performance Optimization**: Query optimization, caching
2. **Comprehensive Testing**: Unit, integration, and E2E tests
3. **Monitoring & Analytics**: Performance metrics, error tracking
4. **Documentation Updates**: API docs, user guides

### Phase 4: Deployment & Monitoring (1-2 weeks)
1. **Staged Rollout**: Feature flags, gradual deployment
2. **User Acceptance Testing**: Beta testing with real users
3. **Production Monitoring**: Performance tracking, error alerting
4. **Post-launch Optimization**: Based on user feedback and metrics

## Success Metrics

### Technical Metrics
- **Search Performance**: <500ms average query response time
- **Notification Latency**: <1 second end-to-end notification delivery
- **Storage Migration**: 99.9% successful migration rate
- **Accessibility Score**: WCAG 2.1 AA compliance

### User Experience Metrics
- **Search Satisfaction**: 80%+ user satisfaction with search results
- **Notification Engagement**: 60%+ notification open rate
- **Performance**: <2 second page load times maintained
- **Accessibility**: Zero critical accessibility issues

### Business Metrics
- **User Retention**: Maintain or improve current retention rates
- **Feature Adoption**: 50%+ user adoption for new features within 3 months
- **System Stability**: 99.5%+ uptime during and after deployment
- **Development Velocity**: 20% improvement in feature delivery time