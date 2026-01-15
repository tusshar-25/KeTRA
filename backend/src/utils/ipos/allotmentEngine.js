export const getAllotmentStatus = (ipo, userAppliedLots = 1) => {
  // subscription pressure by risk
  const oddsMap = {
    Low: 0.7,
    Medium: 0.45,
    High: 0.25,
  };

  const baseOdds = oddsMap[ipo.riskLevel] || 0.4;
  const lotFactor = Math.min(userAppliedLots * 0.05, 0.2);

  const finalOdds = baseOdds - lotFactor;
  const roll = Math.random();

  if (roll < finalOdds) {
    return {
      status: "ALLOTTED",
      shares: ipo.lotSize * userAppliedLots,
      refund: 0,
    };
  }

  return {
    status: "NOT ALLOTTED",
    shares: 0,
    refund: ipo.issuePrice * ipo.lotSize * userAppliedLots,
  };
};
