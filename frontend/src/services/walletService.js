import api from "./api";

// 🔌 Future backend endpoint
export const getWalletSummary = () => {
  return api.get("/wallet/summary");
};
