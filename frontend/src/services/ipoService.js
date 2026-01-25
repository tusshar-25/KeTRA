import api from "./api";

export const getIPOs = (status) => {
  const q = status ? `?status=${status}` : "";
  return api.get(`/ipo${q}`);
};

export const getIPOApplications = () => {
  return api.get("/ipo/applications");
};

export const withdrawIPOApplication = (applicationId, symbol) => {
  // Use the correct endpoint for withdrawal
  return api.post("/ipo/withdraw", { applicationId });
};

// Initialize existing applications into accelerated system
export const initializeAcceleratedIPOs = (applications) => {
  // Create a custom axios instance with longer timeout for initialization
  const axios = require('axios');
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000, // 30 second timeout for initialization
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('ketra_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  return api.post("/ipo/initialize-accelerated", { applications });
};
