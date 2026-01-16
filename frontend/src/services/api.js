import axios from "axios";

const api = axios.create({
  baseURL:  `${import.meta.env.VITE_API_URL}/api`,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ketra_token"); // ✅ correct key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Trade APIs
export const buyStock = (data) => api.post("/trade/buy", data);
export const sellStock = (data) => api.post("/trade/sell", data);
