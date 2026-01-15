export const getMarketStatus = () => {
  const now = new Date();

  // Convert to IST
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const day = ist.getDay(); // 0 = Sunday
  const hours = ist.getHours();
  const minutes = ist.getMinutes();

  const isWeekend = day === 0 || day === 6;

  const isMarketHours =
    (hours > 9 || (hours === 9 && minutes >= 15)) &&
    (hours < 15 || (hours === 15 && minutes <= 30));

  const open = !isWeekend && isMarketHours;

  return {
    open,
    status: open ? "OPEN" : "CLOSED",
    time: ist.toISOString(),
  };
};
