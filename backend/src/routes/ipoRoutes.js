import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getIPOs, checkWithdrawEligibility, getIPOTimelineStatus, getMyAcceleratedIPOs, withdrawIPOFunds, instantProcessIPO } from "../controllers/ipoController.js";
import { 
  withdrawIPOHolding,
  getIPOHoldingDetails
} from "../controllers/ipoWithdrawalController.js";
import { 
  applyIPO as applyIPOWithAllotment,
  getIPOApplications,
  processIPOAllotments,
  processIPOListing,
  withdrawIPOApplication,
  getIPOAllotmentDetails,
  autoProcessAllotments,
  instantIPOProcess
} from "../controllers/ipoAllotmentController.js";
import { validateIPO } from "../middleware/validate.js";
import { 
  processAcceleratedIPOApplication, 
  canWithdrawMoney, 
  getIPOTimeline,
  getUserAcceleratedIPOs,
  TIMELINE,
  initializeExistingApplications
} from "../utils/ipos/acceleratedAllotment.js";

const router = express.Router();

// Get all IPOs
router.get("/", getIPOs);

// Accelerated IPO routes
router.get("/withdraw-eligibility/:symbol", authMiddleware, checkWithdrawEligibility);
router.get("/timeline/:symbol", authMiddleware, getIPOTimelineStatus);
router.get("/my-accelerated-ipos", authMiddleware, getMyAcceleratedIPOs);
router.post("/withdraw/:symbol", authMiddleware, withdrawIPOFunds);
router.post("/initialize-accelerated", authMiddleware, initializeExistingApplications);
router.get("/test-accelerated", authMiddleware, (req, res) => {
  const userId = req.user._id;
  const userIPOs = getUserAcceleratedIPOs(userId);
  
  res.json({
    message: "Accelerated IPO system test",
    userId,
    totalIPOs: userIPOs.length,
    ipos: userIPOs,
    mapSize: userIPOs.length
  });
});

// Apply for IPO (with proper allotment tracking)
router.post("/apply", authMiddleware, validateIPO, applyIPOWithAllotment);

// Instant IPO process for immediate allotment and listing
router.post("/instant-process", authMiddleware, instantIPOProcess);

// Get user's IPO applications and allotments
router.get("/applications", authMiddleware, getIPOApplications);

// Process IPO allotments (admin only)
router.post("/process-allotments", authMiddleware, processIPOAllotments);

// Auto-process IPO allotments for closed IPOs (admin only)
router.post("/auto-process-allotments", authMiddleware, autoProcessAllotments);

// Process IPO listing (admin only)
router.post("/process-listing", authMiddleware, processIPOListing);

// Withdraw IPO holdings
router.post("/ipo-withdraw", authMiddleware, withdrawIPOHolding);

// Get IPO holding details
router.get("/ipo-holding/:holdingId", authMiddleware, getIPOHoldingDetails);

// Withdraw IPO application (more specific route first)
router.post("/withdraw", authMiddleware, withdrawIPOApplication);

// Withdraw IPO funds (less specific route - should come after)
router.post("/withdraw/:symbol", authMiddleware, withdrawIPOFunds);

export default router;
