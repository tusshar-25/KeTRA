/**
 * Checks if the market is currently open based on IST timezone
 * Market hours: 9:15 AM to 3:30 PM (555 to 930 minutes)
 * @returns {boolean} - true if market is open, false otherwise
 */
export const isMarketOpenServer = () => {
  // Set to false for production
  // return true; // Testing mode disabled
  
  const now = new Date();

  // Convert to IST (Asia/Kolkata timezone)
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Market is open from 9:15 AM (555 minutes) to 3:30 PM (930 minutes)
  return totalMinutes >= 555 && totalMinutes <= 930;
};
