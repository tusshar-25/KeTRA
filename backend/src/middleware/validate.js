export const validateBuySell = (req, res, next) => {
  const { symbol, quantity } = req.body;

  if (!symbol || typeof symbol !== "string") {
    res.status(400);
    throw new Error("Invalid stock symbol");
  }

  if (!quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Quantity must be greater than zero");
  }

  next();
};

export const validateIPO = (req, res, next) => {
  const { symbol, amount, shares } = req.body;

  if (!symbol || typeof symbol !== "string") {
    res.status(400);
    throw new Error("Invalid IPO symbol");
  }

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Invalid IPO amount");
  }

  if (!shares || shares <= 0) {
    res.status(400);
    throw new Error("Invalid IPO shares");
  }

  next();
};
