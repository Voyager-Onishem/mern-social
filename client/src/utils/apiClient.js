/**
 * API client with consistent error handling
 */

// Default API URL with fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001';

/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint (without leading slash)
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {Object} options.headers - Request headers
 * @param {Object|FormData} options.body - Request body (will be JSON.stringified unless it's FormData)
 * @param {string} options.token - Auth token (will be added to headers)
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {Function} options.onProgress - Upload progress callback
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    timeout = 30000, // 30 second default timeout
    onProgress,
  } = options;

  // Prepare URL (handle both with and without leading slash)
  const url = `${API_URL}/${endpoint.replace(/^\//, '')}`;
  
  // Prepare headers with auth token if provided
  const requestHeaders = { ...headers };
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  
  // Prepare body (stringify if not FormData)
  let requestBody = body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  
  // Create request options
  const fetchOptions = {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(timeout),
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && requestBody) {
    fetchOptions.body = requestBody;
  }
  
  // Handle upload progress if needed and supported
  if (onProgress && requestBody instanceof FormData && typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      
      // Add headers
      Object.keys(requestHeaders).forEach(key => {
        xhr.setRequestHeader(key, requestHeaders[key]);
      });
      
      // Handle progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      // Handle load
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = xhr.responseText;
          }
          resolve(response);
        } else {
          reject({
            status: xhr.status,
            message: xhr.statusText || 'Request failed',
          });
        }
      });
      
      // Handle error
      xhr.addEventListener('error', () => {
        reject({
          status: xhr.status || 0,
          message: 'Network error occurred',
        });
      });
      
      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject({
          status: 408,
          message: 'Request timeout',
        });
      });
      
      // Handle abort
      xhr.addEventListener('abort', () => {
        reject({
          status: 0,
          message: 'Request aborted',
        });
      });
      
      // Send request
      xhr.send(requestBody);
    });
  }
  
  try {
    // Regular fetch request
    const response = await fetch(url, fetchOptions);
    
    // Check if response is ok
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw {
        status: response.status,
        message: errorMessage,
        response, // Include original response for further handling
      };
    }
    
    // Check content type to determine how to parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    // Handle aborted requests
    if (error.name === 'AbortError') {
      throw {
        status: 408,
        message: 'Request timeout',
      };
    }
    
    // Rethrow API errors
    if (error.status) {
      throw error;
    }
    
    // Handle network errors
    throw {
      status: 0,
      message: error.message || 'Network error',
      originalError: error,
    };
  }
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object|FormData} body - Request body
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
export const post = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'POST', body });
};

/**
 * PATCH request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
export const patch = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'PATCH', body });
};

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

export default {
  get,
  post,
  patch,
  delete: del,
  request: apiRequest,
};