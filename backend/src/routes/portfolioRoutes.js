import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getPortfolio } from "../controllers/portfolioController.js";
import { 
  withdrawIPOHolding,
  getIPOHoldingDetails
} from "../controllers/ipoWithdrawalController.js";
import { 
  getIPOPortfolio
} from "../controllers/ipoPortfolioController.js";

const router = express.Router();

// Get user's complete portfolio (stocks + IPOs)
router.get("/", authMiddleware, getPortfolio);

// Get detailed IPO portfolio
router.get("/ipo-portfolio", authMiddleware, getIPOPortfolio);

// Withdraw IPO holdings
router.post("/ipo-withdraw", authMiddleware, withdrawIPOHolding);

// Get IPO holding details
router.get("/ipo-holding/:holdingId", authMiddleware, getIPOHoldingDetails);

export default router;
