import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL", "IPO", "IPO_BLOCKED", "IPO_WITHDRAWAL"],
      required: true,
    },
    symbol: String,
    quantity: Number,
    price: Number,
    amount: Number,
    description: String,
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
