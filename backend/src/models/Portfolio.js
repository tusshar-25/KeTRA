import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    avgPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    investedValue: {
      type: Number,
      default: 0,
    },
    pnl: {
      type: Number,
      default: 0,
    },
    pnlPercent: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["REGULAR", "IPO"],
      default: "REGULAR",
    },
  },
  { timestamps: true }
);

// Create indexes for better performance
portfolioSchema.index({ user: 1, symbol: 1 });
portfolioSchema.index({ user: 1, type: 1 });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio;
