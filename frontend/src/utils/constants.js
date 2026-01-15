export const MARKET_HOURS = {
  openHour: 9,
  openMinute: 15,
  closeHour: 15,
  closeMinute: 30,
};

const FORCE_MARKET_OPEN = false; // ← set false in production

export const isMarketOpen = () => {
  if (FORCE_MARKET_OPEN) return true;
  const now = new Date();
  const day = now.getDay(); // 0 Sun, 6 Sat
  if (day === 0 || day === 6) return false;

  const mins = now.getHours() * 60 + now.getMinutes();
  const open =
    MARKET_HOURS.openHour * 60 + MARKET_HOURS.openMinute;
  const close =
    MARKET_HOURS.closeHour * 60 + MARKET_HOURS.closeMinute;

  return mins >= open && mins <= close;
};
