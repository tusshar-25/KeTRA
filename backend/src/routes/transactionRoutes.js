import express from "express";
import { getTransactions, getTransactionSummary } from "../controllers/transactionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/transactions
 * @desc    Get all user transactions
 * @access  Private
 */
router.get("/", getTransactions);

/**
 * @route   GET /api/transactions/summary
 * @desc    Get transaction summary statistics
 * @access  Private
 */
router.get("/summary", getTransactionSummary);

export default router;
