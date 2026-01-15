import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { buyStock, sellStock } from "../controllers/tradeController.js";
import { validateBuySell } from "../middleware/validate.js";

const router = express.Router();

router.post("/buy", authMiddleware, validateBuySell, buyStock);
router.post("/sell", authMiddleware, validateBuySell, sellStock);

export default router;
