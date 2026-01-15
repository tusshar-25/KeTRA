import { generatePerformance } from "./ipoPerformance";

export const convertIPOToHolding = (ipo, allotmentResult) => {
  if (allotmentResult.status !== "ALLOTTED") return null;

  const performance = generatePerformance(ipo.issuePrice);

  return {
    symbol: ipo.symbol,
    name: ipo.name,
    quantity: allotmentResult.shares,
    avgPrice: ipo.issuePrice,
    listingPrice: performance.listedPrice,
    type: "IPO",
    pnl: {
      change: performance.change,
      percent: performance.percentChange,
      positive: performance.positive,
    },
  };
};
