import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useIPO } from '../../context/IPOContext';
import IPOCountdown from './IPOCountdown';

const EnhancedIPOCard = ({ ipo, onApplySuccess }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const { appliedIPOs, applyIPO } = useIPO();

  // Check if user has already applied for this IPO
  useEffect(() => {
    const applied = appliedIPOs.some(
      (appliedIPO) => appliedIPO.symbol === ipo.symbol && appliedIPO.status === 'applied'
    );
    setHasApplied(applied);
  }, [appliedIPOs, ipo.symbol]);

  const handleIPOClick = () => {
    setShowModal(true);
  };

  const handleApply = async () => {
    if (!user) {
      showAlert({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login to apply for IPOs'
      });
      return;
    }

    setIsApplying(true);
    
    try {
      // Apply with minimum investment
      await applyIPO(ipo, 1);
      
      showAlert({
        type: 'success',
        title: 'Application Submitted!',
        message: `Your application for ${ipo.name} has been successfully submitted. You will be notified about allotment results in portfolio.`
      });
      
      if (onApplySuccess) {
        onApplySuccess();
      }
      
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Application Failed',
        message: error.response?.data?.message || 'Failed to apply for IPO'
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={handleIPOClick}
        className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 rounded-xl border border-slate-800/50 p-5 transition-all hover:border-indigo-500/40 cursor-pointer"
      >
      {/* IPO Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 leading-snug">
            {ipo.name}
          </h3>
          <p className="text-slate-400 text-sm mt-1">{ipo.symbol} • {ipo.sector}</p>
        </div>
        
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${ipo.status === 'open' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : ipo.status === 'upcoming' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
          {ipo.status.toUpperCase()}
        </span>
      </div>

      {/* IPO Details */}
      <div className="space-y-2 text-xs text-slate-400 mb-4">
        <div className="flex justify-between">
          <span>Price Band:</span>
          <span className="text-slate-300">{ipo.priceBand}</span>
        </div>
        <div className="flex justify-between">
          <span>Lot Size:</span>
          <span className="text-slate-300">{ipo.lotSize} shares</span>
        </div>
        <div className="flex justify-between">
          <span>Min Investment:</span>
          <span className="text-slate-300">₹{ipo.minInvestment ? ipo.minInvestment.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Dates:</span>
          <span className="text-slate-300">{ipo.openDate} → {ipo.closeDate}</span>
        </div>
      </div>

      {/* Action Button */}
      {ipo.status === 'open' ? (
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={hasApplied || isApplying}
          onClick={handleApply}
          className={`
            w-full rounded-lg py-2.5 text-xs font-semibold transition-all
            ${hasApplied || isApplying ?
              'bg-slate-800 text-slate-500 cursor-not-allowed' :
              'bg-indigo-500/90 hover:bg-indigo-500 text-slate-900 shadow-lg shadow-indigo-500/25'
            }
          `}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
              />
              Applying...
            </span>
          ) : hasApplied ? (
            'Application Submitted'
          ) : (
            'Apply Now'
          )}
        </motion.button>
      ) : (
        <button
          disabled
          className="w-full rounded-lg bg-slate-800 text-slate-500 text-xs font-medium py-2.5 cursor-not-allowed"
        >
          {ipo.status === 'upcoming' ? 'Opens Soon' : 'Not Available'}
        </button>
      )}
    </motion.div>

      {/* IPO Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    ipo.status === 'open' ? 'bg-emerald-500' :
                    ipo.status === 'upcoming' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`} />
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">
                      {ipo.name}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {ipo.symbol} • {ipo.sector}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  ipo.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  ipo.status === 'upcoming' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }`}>
                  {ipo.status.toUpperCase()}
                </span>
              </div>

              {/* Modal Content - Compact Single View */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column - Key Info */}
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-100 mb-3">Key Metrics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Issue Price</p>
                          <p className="text-sm font-bold text-slate-100">₹{ipo.issuePrice || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Lot Size</p>
                          <p className="text-sm font-bold text-slate-100">{ipo.lotSize || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Price Band</p>
                          <p className="text-sm font-bold text-slate-100">{ipo.priceBand}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Min Investment</p>
                          <p className="text-sm font-bold text-slate-100">₹{ipo.minInvestment ? ipo.minInvestment.toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Important Dates */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-100 mb-3">Important Dates</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-400">Open Date</p>
                          <p className="text-xs font-medium text-slate-100">{ipo.openDate}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-400">Close Date</p>
                          <p className="text-xs font-medium text-slate-100">{ipo.closeDate}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-400">Listing</p>
                          <p className="text-xs font-medium text-slate-100">2 mins after allotment</p>
                        </div>
                      </div>
                      {ipo.status === 'open' && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-slate-400">⚡ Fast Track Timeline</p>
                          <p className="text-xs text-indigo-400">Allotment: 1 min • Listing: 2 mins</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Status & Action */}
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-100 mb-3">Status</h3>
                      <div className="flex items-center justify-center mb-3">
                        <div className={`w-4 h-4 rounded-full ${
                          ipo.status === 'open' ? 'bg-emerald-500' :
                          ipo.status === 'upcoming' ? 'bg-amber-500' :
                          'bg-slate-500'
                        }`} />
                        <span className={`ml-2 text-sm font-medium ${
                          ipo.status === 'open' ? 'text-emerald-400' :
                          ipo.status === 'upcoming' ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Investment Details */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-100 mb-3">Investment Details</h3>
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Min Investment</p>
                          <p className="text-lg font-bold text-indigo-400">₹{ipo.minInvestment ? ipo.minInvestment.toLocaleString() : 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Shares per Lot</p>
                          <p className="text-lg font-bold text-blue-400">{ipo.lotSize || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Issue Price</p>
                          <p className="text-lg font-bold text-green-400">₹{ipo.issuePrice || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {ipo.status === 'open' && !hasApplied && (
                        <button
                          onClick={handleApply}
                          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition font-medium"
                        >
                          Apply Now
                        </button>
                      )}
                      {ipo.status === 'open' && hasApplied && (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-slate-800 text-slate-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          Already Applied
                        </button>
                      )}
                      {ipo.status === 'upcoming' && (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-slate-800 text-slate-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          Opens Soon
                        </button>
                      )}
                      {ipo.status === 'closed' && (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-slate-800 text-slate-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          Closed
                        </button>
                      )}
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedIPOCard;
