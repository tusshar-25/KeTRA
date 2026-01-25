import { getMarketStatus as getMarketStatusFromBackend } from "../services/marketStatusService";

export const getMarketStatus = () => {
  // Use backend API for unified market status
  return getMarketStatusFromBackend();
};
