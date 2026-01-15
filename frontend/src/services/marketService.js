import api from "./api";

export const getMarketIndices = () => {
  return api.get("/market/indices");
};

export const getLiveStocks = (symbols) =>
  api.get(`/market/stocks${symbols && symbols.length > 0 ? `?symbols=${symbols.join(",")}` : ""}`);

export const getSMEStocks = (symbols) =>
  api.get(`/market/sme-stocks${symbols && symbols.length > 0 ? `?symbols=${symbols.join(",")}` : ""}`);

export const buyStock = async (symbol, quantity, price) => {
  try {
    return await api.post("/market/buy", { symbol, quantity, price });
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Please login to buy stocks");
    }
    throw error;
  }
};

export const sellStock = async (symbol, quantity, price) => {
  try {
    return await api.post("/market/sell", { symbol, quantity, price });
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
  return api.get("/market/portfolio");
};

export const getTransactions = () => {
  return api.get("/market/transactions");
};
