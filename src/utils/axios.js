import axios from 'axios';
import { API_BASE } from './api';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased from 10s to 30s to handle slower responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if available
let isInterceptorAttached = false;

if (!isInterceptorAttached) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle common error cases
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle common error responses
      if (error.response) {
        const { status } = error.response;
        
        // Handle authentication errors
        if (status === 401 || status === 403) {
          try {
            // Check if token still exists in localStorage
            const currentToken = localStorage.getItem('token');
            const isManualLogout = localStorage.getItem('isManualLogout') === 'true';

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isManualLogout');

            // Show session expired message only when not manually logged out and token exists
            if (currentToken && !isManualLogout && typeof window !== 'undefined') {
              const evt = new CustomEvent('sessionExpired', { detail: { status, url: error.config?.url } });
              window.dispatchEvent(evt);
            }
          } catch (e) {
            console.error('Error during logout:', e);
          }
        }
      }
      return Promise.reject(error);
    }
  );
  
  isInterceptorAttached = true;
}

export default axiosInstance;