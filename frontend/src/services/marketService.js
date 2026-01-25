import api from "./api";
import axios from "axios";

// Create a separate API instance for market data with longer timeout
const marketApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor to marketApi
marketApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("ketra_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
marketApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Market API Error:', error.message);
    
    // Return mock data for development/fallback
    if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      console.warn('Using fallback data due to API unavailability');
      return Promise.resolve({
        data: {
          stocks: [],
          indices: [],
          message: 'Using fallback data - API unavailable'
        }
      });
    }
    
    return Promise.reject(error);
  }
);

export const getMarketIndices = () => {
  return api.get("market/indices");
};

export const getLiveStocks = (symbols) => {
  const url = `market/stocks${symbols && symbols.length > 0 ? `?symbols=${symbols.join(",")}` : ""}`;
  return marketApi.get(url);
};

export const getSMEStocks = (symbols) => {
  const url = `sme-stocks${symbols && symbols.length > 0 ? `?symbols=${symbols.join(",")}` : ""}`;
  return marketApi.get(url);
};

export const buyStock = async (symbol, quantity, price) => {
  try {
    return await api.post("market/buy", { symbol, quantity, price });
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Please login to buy stocks");
    }
    throw error;
  }
};

export const sellStock = async (symbol, quantity, price) => {
  try {
    return await api.post("market/sell", { symbol, quantity, price });
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Please login to sell stocks");
    }
    if (error.response?.status === 400 && error.response?.data?.message?.includes("Insufficient holdings")) {
      throw new Error("Insufficient holdings to sell");
    }
    throw error;
  }
};

export const getPortfolio = () => {
  return api.get("market/portfolio");
};

export const getTransactions = () => {
  return api.get("market/transactions");
};

export const getHistoricalData = (symbol, period = "1mo") => {
  return api.get(`market/historical/${symbol}?period=${period}`);
};

export const getComprehensiveData = (symbol) => {
  return api.get(`market/comprehensive/${symbol}`);
};
