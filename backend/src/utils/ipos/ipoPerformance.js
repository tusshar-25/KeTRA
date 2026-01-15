export const generatePerformance = (issuePrice) => {
  // realistic IPO behaviour
  const volatility = Math.random() * 0.6 - 0.2; // -20% to +40%
  const listedPrice = Math.round(issuePrice * (1 + volatility));

  const change = listedPrice - issuePrice;
  const percentChange = ((change / issuePrice) * 100).toFixed(2);

  return {
    listedPrice,
    change,
    percentChange: `${percentChange}%`,
    positive: change >= 0,
  };
};
