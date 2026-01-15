import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getIPOs } from "../controllers/ipoController.js";
import { 
  applyIPO as applyIPOWithAllotment,
  getIPOApplications,
  processIPOAllotments,
  processIPOListing,
  withdrawIPOApplication,
  getIPOAllotmentDetails,
  autoProcessAllotments
} from "../controllers/ipoAllotmentController.js";
import { validateIPO } from "../middleware/validate.js";

const router = express.Router();

// Get all IPOs
router.get("/", getIPOs);

// Apply for IPO (with proper allotment tracking)
router.post("/apply", authMiddleware, validateIPO, applyIPOWithAllotment);

// Get user's IPO applications and allotments
router.get("/applications", authMiddleware, getIPOApplications);

// Process IPO allotments (admin only)
router.post("/process-allotments", authMiddleware, processIPOAllotments);

// Auto-process IPO allotments for closed IPOs (admin only)
router.post("/auto-process-allotments", authMiddleware, autoProcessAllotments);

// Process IPO listing (admin only)
router.post("/process-listing", authMiddleware, processIPOListing);

// Withdraw IPO application
router.post("/withdraw", authMiddleware, withdrawIPOApplication);

// Get IPO allotment details
router.get("/allotment/:applicationId", authMiddleware, getIPOAllotmentDetails);

// Auto-process IPOs based on dates (admin only)
router.post("/auto-process-dates", authMiddleware, autoProcessAllotments);

export default router;
