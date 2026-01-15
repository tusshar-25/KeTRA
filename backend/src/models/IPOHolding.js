import mongoose from 'mongoose';

const ipoHoldingSchema = new mongoose.Schema({
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
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IPOAllotment',
    required: true
  },
  sharesAllotted: {
    type: Number,
    required: true
  },
  allotmentPrice: {
    type: Number,
    required: true
  },
  totalInvestment: {
    type: Number,
    required: true
  },
  listingPrice: {
    type: Number,
    default: null
  },
  currentValue: {
    type: Number,
    default: null
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['allotted', 'listed', 'sold'],
    default: 'allotted'
  },
  allotmentDate: {
    type: Date,
    default: Date.now
  },
  listingDate: {
    type: Date
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
ipoHoldingSchema.index({ user: 1, status: 1 });
ipoHoldingSchema.index({ ipoSymbol: 1 });
ipoHoldingSchema.index({ applicationId: 1 });

export default mongoose.model('IPOHolding', ipoHoldingSchema);
