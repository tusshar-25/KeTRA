import api from "./api";

export const getTransactions = () => {
  return api.get("transactions");
};
