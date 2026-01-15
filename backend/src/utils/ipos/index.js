import iposOpen from "./iposOpen.js";
import iposUpcoming from "./iposUpcoming.js";
import iposClosed from "./iposClosed.js";

import { getCurrentIPOStatus } from "./rotationEngine.js";

// Get real-time IPO status based on current date
const rotated = getCurrentIPOStatus();

export const openIPOs = rotated.open;
export const upcomingIPOs = rotated.upcoming;
export const closedIPOs = rotated.closed;

// Export the complete IPO_DATA structure for the controller
export const IPO_DATA = {
  open: rotated.open,
  upcoming: rotated.upcoming,
  closed: rotated.closed,
  all: [...rotated.open, ...rotated.upcoming, ...rotated.closed]
};

// Export function to refresh IPO data (can be called from controller)
export const refreshIPOData = () => {
  const freshData = getCurrentIPOStatus();
  return {
    open: freshData.open,
    upcoming: freshData.upcoming,
    closed: freshData.closed,
    all: [...freshData.open, ...freshData.upcoming, ...freshData.closed]
  };
};
