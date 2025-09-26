# SOLID Code Examples

This file contains code examples that demonstrate each SOLID principle in practice. Use these examples to take screenshots or to implement in your project.

## Single Responsibility Principle (SRP)

### Bad Example (Violates SRP)

```javascript
// PostController.js - Too many responsibilities!
export const createPost = async (req, res) => {
  try {
    // Authentication logic
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // File validation logic
    if (req.file && !['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type" });
    }
    
    // Business logic for post creation
    const newPost = new Post({
      userId: req.user.id,
      description: req.body.description,
      picturePath: req.file ? req.file.filename : "",
    });
    
    // Database interaction
    await newPost.save();
    
    // Email notification logic
    await sendNotificationEmail(req.user.email, "Your post was created!");
    
    // Analytics tracking
    trackPostCreation(req.user.id, newPost._id);
    
    // Response formatting
    const posts = await Post.find();
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};
```

### Good Example (Follows SRP)

```javascript
// authMiddleware.js - Authentication responsibility
export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ")[1];
    if (!token) return res.status(403).json({ message: "Access denied" });
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// fileValidator.js - File validation responsibility
export const validateImageFile = (req, res, next) => {
  if (req.file && !['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
    return res.status(400).json({ message: "Invalid file type" });
  }
  next();
};

// postService.js - Business logic responsibility
export const createNewPost = async (userId, description, picturePath) => {
  const newPost = new Post({
    userId,
    description,
    picturePath,
  });
  await newPost.save();
  return newPost;
};

// notificationService.js - Notification responsibility
export const notifyPostCreation = async (userEmail) => {
  await sendNotificationEmail(userEmail, "Your post was created!");
};

// analyticsService.js - Analytics responsibility
export const trackPostCreation = (userId, postId) => {
  // Logic for tracking post creation
};

// PostController.js - Orchestrates the process
export const createPost = async (req, res) => {
  try {
    // All the separate responsibilities are delegated to specialized modules
    const newPost = await createNewPost(
      req.user.id,
      req.body.description,
      req.file ? req.file.filename : ""
    );
    
    await notifyPostCreation(req.user.email);
    trackPostCreation(req.user.id, newPost._id);
    
    const posts = await Post.find();
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};
```

## Open/Closed Principle (OCP)

### Bad Example (Violates OCP)

```javascript
// video.js - Hard to extend for new providers
export const extractVideoId = (url) => {
  let videoId = null;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return { provider: 'youtube', videoId };
  }
  
  // Vimeo
  else if (url.includes('vimeo.com')) {
    videoId = url.split('vimeo.com/')[1].split('?')[0];
    return { provider: 'vimeo', videoId };
  }
  
  // If we add a new provider, we need to modify this function
  
  return null;
};
```

### Good Example (Follows OCP)

```javascript
// video.js - Extensible provider system
const providers = {
  youtube: {
    pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i,
    extract: (url) => {
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        return urlParams.get('v');
      } else if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
      }
      return null;
    },
    embedUrl: (videoId) => `https://www.youtube.com/embed/${videoId}`
  },
  
  vimeo: {
    pattern: /^(https?:\/\/)?(www\.)?vimeo\.com\//i,
    extract: (url) => {
      return url.split('vimeo.com/')[1].split('?')[0];
    },
    embedUrl: (videoId) => `https://player.vimeo.com/video/${videoId}`
  }
  
  // New providers can be added here without modifying existing code
  // Example:
  // dailymotion: {
  //   pattern: /^(https?:\/\/)?(www\.)?dailymotion\.com\//i,
  //   extract: (url) => { ... },
  //   embedUrl: (videoId) => `https://www.dailymotion.com/embed/video/${videoId}`
  // }
};

export const extractVideoInfo = (url) => {
  for (const [provider, config] of Object.entries(providers)) {
    if (config.pattern.test(url)) {
      const videoId = config.extract(url);
      if (videoId) {
        return { provider, videoId, embedUrl: config.embedUrl(videoId) };
      }
    }
  }
  return null;
};

// To add a new provider, we don't modify the extractVideoInfo function,
// we just add a new entry to the providers object
```

## Liskov Substitution Principle (LSP)

### Bad Example (Violates LSP)

```javascript
// Base class
class FileStorage {
  constructor() {
    if (this.constructor === FileStorage) {
      throw new Error("Abstract class cannot be instantiated");
    }
  }
  
  async saveFile(file) {
    throw new Error("Method 'saveFile' must be implemented");
  }
  
  async getFileUrl(fileId) {
    throw new Error("Method 'getFileUrl' must be implemented");
  }
  
  async deleteFile(fileId) {
    throw new Error("Method 'deleteFile' must be implemented");
  }
}

// Implementation that violates LSP
class ReadOnlyStorage extends FileStorage {
  async saveFile(file) {
    // Violates LSP by changing the contract
    throw new Error("Cannot save files in read-only storage");
  }
  
  async getFileUrl(fileId) {
    return `https://storage.example.com/files/${fileId}`;
  }
  
  async deleteFile(fileId) {
    // Violates LSP by changing the contract
    throw new Error("Cannot delete files in read-only storage");
  }
}

// Usage that will break
async function uploadUserAvatar(storage, file) {
  // This will throw an error if ReadOnlyStorage is used,
  // breaking the expectation that any FileStorage can be used here
  const fileId = await storage.saveFile(file);
  return fileId;
}
```

### Good Example (Follows LSP)

```javascript
// Base interface
class StorageProvider {
  constructor() {
    if (this.constructor === StorageProvider) {
      throw new Error("Abstract class cannot be instantiated");
    }
  }
  
  async saveFile(file) {
    throw new Error("Method 'saveFile' must be implemented");
  }
  
  async getFileUrl(fileId) {
    throw new Error("Method 'getFileUrl' must be implemented");
  }
  
  async deleteFile(fileId) {
    throw new Error("Method 'deleteFile' must be implemented");
  }
}

// Implementation for disk storage
class DiskStorage extends StorageProvider {
  async saveFile(file) {
    // Implementation for saving to disk
    const fileId = generateId();
    // ... save file to disk
    return fileId;
  }
  
  async getFileUrl(fileId) {
    return `/assets/${fileId}`;
  }
  
  async deleteFile(fileId) {
    // Implementation for deleting from disk
    return true;
  }
}

// Implementation for cloud storage
class S3Storage extends StorageProvider {
  async saveFile(file) {
    // Implementation for saving to S3
    const fileId = generateId();
    // ... save file to S3
    return fileId;
  }
  
  async getFileUrl(fileId) {
    return `https://s3.example.com/bucket/${fileId}`;
  }
  
  async deleteFile(fileId) {
    // Implementation for deleting from S3
    return true;
  }
}

// Read-only provider defined separately, not extending StorageProvider
class ReadOnlyProvider {
  async getFileUrl(fileId) {
    return `https://storage.example.com/files/${fileId}`;
  }
}

// Usage that works with any StorageProvider
async function uploadUserAvatar(storage, file) {
  const fileId = await storage.saveFile(file);
  const url = await storage.getFileUrl(fileId);
  return { fileId, url };
}
```

## Interface Segregation Principle (ISP)

### Bad Example (Violates ISP)

```javascript
// A component that needs too many props, many of which it doesn't use
const UserProfile = ({ 
  user,
  posts,
  friends,
  notifications,
  messages,
  settings,
  analytics,
  onPostLike,
  onPostComment,
  onFriendAdd,
  onFriendRemove,
  onMessageSend,
  onSettingsUpdate,
  onProfileUpdate,
  // ...many more props
}) => {
  // This component only uses user data and profile update functionality
  // but is forced to receive all these other props
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={() => onProfileUpdate({ ...user, name: "New Name" })}>
        Update Profile
      </button>
    </div>
  );
};
```

### Good Example (Follows ISP)

```javascript
// A component that only requires the props it actually uses
const UserProfile = ({ 
  user,
  onProfileUpdate
}) => {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={() => onProfileUpdate({ ...user, name: "New Name" })}>
        Update Profile
      </button>
    </div>
  );
};

// Specialized components for other features
const UserPosts = ({ posts, onPostLike, onPostComment }) => {
  // Implementation
};

const UserFriends = ({ friends, onFriendAdd, onFriendRemove }) => {
  // Implementation
};

// A container component that composes these focused components
const UserDashboard = (props) => {
  return (
    <div>
      <UserProfile 
        user={props.user}
        onProfileUpdate={props.onProfileUpdate}
      />
      <UserPosts
        posts={props.posts}
        onPostLike={props.onPostLike}
        onPostComment={props.onPostComment}
      />
      <UserFriends
        friends={props.friends}
        onFriendAdd={props.onFriendAdd}
        onFriendRemove={props.onFriendRemove}
      />
    </div>
  );
};
```

## Dependency Inversion Principle (DIP)

### Bad Example (Violates DIP)

```javascript
// PostsWidget directly depends on concrete implementation
import axios from 'axios';

const PostsWidget = () => {
  const [posts, setPosts] = useState([]);
  
  const fetchPosts = async () => {
    try {
      // Direct dependency on axios and hardcoded URL
      const response = await axios.get("http://localhost:3001/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };
  
  const recordImpression = async (postId) => {
    try {
      // Direct dependency on axios and hardcoded URL
      await axios.post("http://localhost:3001/analytics/impression", { postId });
    } catch (error) {
      console.error("Failed to record impression:", error);
    }
  };
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  return (
    <div>
      {posts.map(post => (
        <div key={post._id} onMouseEnter={() => recordImpression(post._id)}>
          {post.description}
        </div>
      ))}
    </div>
  );
};
```

### Good Example (Follows DIP)

```javascript
// apiService.js - Abstract API interface
export const createApiService = (baseApi = axios) => ({
  getPosts: async () => {
    const response = await baseApi.get("/posts");
    return response.data;
  },
  
  recordImpression: async (postId) => {
    await baseApi.post("/analytics/impression", { postId });
  },
});

// configureApi.js - Configuration
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiService = createApiService(api);

// For testing, we could create a mock version:
// export const mockApiService = createApiService({
//   get: async () => ({ data: [{ _id: "1", description: "Test post" }] }),
//   post: async () => ({ data: { success: true } }),
// });

// PostsWidget.jsx - Depends on abstraction, not implementation
import { apiService } from './configureApi';

const PostsWidget = ({ apiClient = apiService }) => {
  const [posts, setPosts] = useState([]);
  
  const fetchPosts = async () => {
    try {
      // Depends on abstraction, not concrete implementation
      const data = await apiClient.getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };
  
  const recordImpression = async (postId) => {
    try {
      // Depends on abstraction, not concrete implementation
      await apiClient.recordImpression(postId);
    } catch (error) {
      console.error("Failed to record impression:", error);
    }
  };
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  return (
    <div>
      {posts.map(post => (
        <div key={post._id} onMouseEnter={() => recordImpression(post._id)}>
          {post.description}
        </div>
      ))}
    </div>
  );
};
```