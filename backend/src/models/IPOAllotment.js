import mongoose from 'mongoose';

const ipoAllotmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipoId: {
    type: String,
    required: true
  },
  ipoSymbol: {
    type: String,
    required: true
  },
  ipoName: {
    type: String,
    required: true
  },
  amountApplied: {
    type: Number,
    required: true
  },
  sharesApplied: {
    type: Number,
    required: true
  },
  sharesAllotted: {
    type: Number,
    default: 0
  },
  amountAllotted: {
    type: Number,
    default: 0
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'allotted', 'not_allotted', 'refunded'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  allotmentDate: {
    type: Date
  },
  listingDate: {
    type: Date
  },
  listingPrice: {
    type: Number
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  isWithdrawn: {
    type: Boolean,
    default: false
  },
  withdrawalDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
ipoAllotmentSchema.index({ user: 1, status: 1 });
ipoAllotmentSchema.index({ ipoId: 1 });
ipoAllotmentSchema.index({ ipoSymbol: 1 });

export default mongoose.model('IPOAllotment', ipoAllotmentSchema);
