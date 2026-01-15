import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    balance: req.user.balance,
    transactions,
  });
});

export default router;
