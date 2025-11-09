/**
 * Network resilience utilities for handling retries and offline scenarios
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry attempt
 * @returns {Promise<any>} Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    shouldRetry = (error) => {
      // Retry on network errors and 5xx server errors
      if (!error.status) return true; // Network error
      if (error.status >= 500 && error.status < 600) return true; // Server error
      if (error.status === 408 || error.status === 429) return true; // Timeout or rate limit
      return false;
    },
    onRetry = () => {},
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const currentDelay = Math.min(delay, maxDelay);
      
      // Add jitter (±25%) to prevent thundering herd
      const jitter = currentDelay * 0.25 * (Math.random() * 2 - 1);
      const delayWithJitter = Math.max(0, currentDelay + jitter);

      // Notify about retry
      onRetry({
        attempt: attempt + 1,
        maxRetries,
        delay: delayWithJitter,
        error: lastError,
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));

      // Increase delay for next attempt
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Network status manager
 */
class NetworkStatusManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Periodically check connection health
    this.startHealthCheck();
  }

  handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners({ type: 'online', isOnline: true });
  };

  handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners({ type: 'offline', isOnline: false });
  };

  startHealthCheck() {
    // Check connection every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (navigator.onLine && !this.isOnline) {
        this.handleOnline();
      } else if (!navigator.onLine && this.isOnline) {
        this.handleOffline();
      }
    }, 30000);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      effectiveType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || null,
      rtt: navigator.connection?.rtt || null,
    };
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusManager();

/**
 * Request queue for offline scenarios
 */
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxQueueSize = 50;

    // Load queued requests from localStorage
    this.loadQueue();

    // Process queue when coming back online
    networkStatus.subscribe((event) => {
      if (event.type === 'online' && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Add request to queue
   * @param {Object} request - Request details
   * @param {Function} request.fn - Function to execute
   * @param {string} request.id - Unique request ID
   * @param {Object} request.metadata - Additional metadata
   * @returns {Promise} Promise that resolves when request is processed
   */
  enqueue(request) {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      this.queue.push({
        ...request,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.saveQueue();

      // Try to process if online
      if (networkStatus.isOnline) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0 && networkStatus.isOnline) {
      const request = this.queue[0];

      try {
        const result = await request.fn();
        request.resolve(result);
        this.queue.shift(); // Remove from queue
        this.saveQueue();
      } catch (error) {
        // If network error, stop processing and wait for reconnection
        if (!error.status || error.status === 0) {
          console.log('Network error processing queue, will retry when online');
          break;
        }

        // For other errors, reject and remove from queue
        request.reject(error);
        this.queue.shift();
        this.saveQueue();
      }
    }

    this.processing = false;
  }

  saveQueue() {
    try {
      // Only save metadata, not the function references
      const queueMetadata = this.queue.map(req => ({
        id: req.id,
        metadata: req.metadata,
        timestamp: req.timestamp,
      }));
      localStorage.setItem('requestQueue', JSON.stringify(queueMetadata));
    } catch (error) {
      console.error('Error saving request queue:', error);
    }
  }

  loadQueue() {
    try {
      const saved = localStorage.getItem('requestQueue');
      if (saved) {
        // We can only restore metadata, actual functions need to be re-registered
        const queueMetadata = JSON.parse(saved);
        console.log(`Found ${queueMetadata.length} queued requests from previous session`);
      }
    } catch (error) {
      console.error('Error loading request queue:', error);
    }
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  getQueueSize() {
    return this.queue.length;
  }
}

export const requestQueue = new RequestQueue();

/**
 * React hook for network status
 * Usage:
 *   const { isOnline, status } = useNetworkStatus();
 */
export function useNetworkStatus() {
  const [status, setStatus] = React.useState(() => networkStatus.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkStatus.subscribe(() => {
      setStatus(networkStatus.getStatus());
    });

    return unsubscribe;
  }, []);

  return {
    isOnline: status.isOnline,
    status,
  };
}

// Note: Need to import React for the hook
import React from 'react';
