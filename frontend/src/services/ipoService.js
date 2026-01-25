import api from "./api";
import axios from "axios";

export const getIPOs = (status) => {
  const q = status ? `?status=${status}` : "";
  return api.get(`ipo${q}`);
};

export const getIPOApplications = () => {
  return api.get("ipo/applications");
};

export const withdrawIPOApplication = (applicationId, symbol) => {
  // Use the correct endpoint for withdrawal
  return api.post("ipo/withdraw", { applicationId });
};

// Initialize existing applications into accelerated system
export const initializeAcceleratedIPOs = (applications) => {
  // Create a custom axios instance with very short timeout
  const customApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 2000, // 2 second timeout - backend responds immediately now
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('ketra_token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  return customApi.post("ipo/initialize-accelerated", { applications });
};
