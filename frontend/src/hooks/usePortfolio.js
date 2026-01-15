import { useTrade } from "../context/TradeContext";

const usePortfolio = () => {
  const { portfolio } = useTrade();

  const invested = portfolio.reduce(
    (sum, p) => sum + p.quantity * p.avgPrice,
    0
  );

  const currentValue = portfolio.reduce(
    (sum, p) => sum + p.quantity * p.currentPrice,
    0
  );

  return {
    holdings: portfolio,
    invested,
    currentValue,
    pnl: currentValue - invested,
    loading: false,
  };
};

export default usePortfolio;
