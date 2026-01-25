import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache market status for 1 minute to reduce API calls
let cachedMarketStatus = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get market status from backend
 * @returns {Promise} Market status data
 */
export const getMarketStatus = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedMarketStatus && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedMarketStatus;
    }

    const response = await axios.get(`${API_BASE_URL}/market/status`);
    cachedMarketStatus = response.data;
    lastFetchTime = now;
    return response.data;
  } catch (error) {
    console.error('Failed to fetch market status:', error);
    // Return cached data if available, even if expired
    if (cachedMarketStatus) {
      return cachedMarketStatus;
    }
    
    // Fallback to client-side calculation if backend fails
    // Use the same logic as backend for consistency
    const now = new Date();
    
    // Convert to IST (Asia/Kolkata timezone)
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Check if it's a weekday (Monday-Friday)
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if it's within market hours (9:15 AM - 3:30 PM IST)
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30; // 3:30 PM in minutes
    const currentTime = hours * 60 + minutes;
    const isMarketHours = isWeekday && currentTime >= marketStart && currentTime <= marketEnd;

    const fallbackData = {
      isOpen: isMarketHours, // Temporarily override to true for testing
      currentTime: istTime.toISOString(),
      marketHours: {
        open: "09:15 AM",
        close: "03:30 PM", 
        timezone: "IST",
        weekdays: "Monday - Friday"
      },
      lastChecked: istTime.toISOString(),
      fallback: true
    };

    // Cache fallback data for shorter duration
    cachedMarketStatus = fallbackData;
    lastFetchTime = now;
    
    return fallbackData;
  }
};
