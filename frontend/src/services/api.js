import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ketra_token"); // correct key
  console.log('🔑 Using token:', token ? 'exists' : 'missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 404 errors to reduce console noise
    if (error.response?.status !== 404) {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚫 Token expired or invalid');
      localStorage.removeItem("ketra_token");
      localStorage.removeItem("user");
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
