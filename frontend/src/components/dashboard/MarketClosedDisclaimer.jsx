import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketStatus } from '../../services/marketStatusService';

const MarketClosedDisclaimer = ({ currentDateTime }) => {
  const [isMarketHours, setIsMarketHours] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Format date for display
  const formatDisplayDate = (date) => {
    const options = { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-IN', options);
  };

  // Format time for display
  const formatDisplayTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Check if current time is within market hours (9:15 AM - 3:30 PM IST, Monday-Friday)
  const checkMarketHours = (date) => {
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // 330 minutes
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    const istMinutes = (utcMinutes + istOffset) % (24 * 60);
    
    // Handle day wrap-around
    const utcDay = date.getUTCDay();
    const istDay = utcMinutes + istOffset >= 24 * 60 ? 
      (utcDay + 1) % 7 : 
      (utcMinutes + istOffset < 0 ? (utcDay - 1 + 7) % 7 : utcDay);
    
    // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes)
    const marketStart = 9 * 60 + 15;
    const marketEnd = 15 * 60 + 30;
    
    // Check if it's weekday (Monday-Friday) and within market hours
    const isWeekday = istDay >= 1 && istDay <= 5;
    const isWithinHours = istMinutes >= marketStart && istMinutes <= marketEnd;
    
    return isWeekday && isWithinHours;
  };

  useEffect(() => {
    const fetchMarketStatus = async () => {
      try {
        setLoading(true);
        const status = await getMarketStatus();
        setMarketStatus(status);
        setIsMarketHours(status.isOpen);
        
        // Update current time from backend
        if (status.currentTime) {
          setCurrentTime(new Date(status.currentTime));
        }
      } catch (error) {
        console.error('Failed to fetch market status from backend:', error);
        // Fallback to client-side calculation
        const now = new Date();
        setCurrentTime(now);
        setIsMarketHours(checkMarketHours(now));
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMarketStatus();
    
    // Update every 2 minutes instead of every minute
    const interval = setInterval(fetchMarketStatus, 120000);

    return () => clearInterval(interval);
  }, []);

  const disclaimerTexts = [
    " Market Closed: Indian markets are currently closed",
    " Market Hours: 9:15 AM - 3:30 PM IST (Monday-Friday)",
    " Practice Trading: Continue practicing with virtual funds"
  ];

  const openMarketTexts = [
    " Market Open: Indian markets are currently active",
    " Live Trading: Real-time market data available",
    " Practice Trading: Practice with virtual funds"
  ];

  // Always show the disclaimer
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-3 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMarketHours ? 'bg-green-400' : 'bg-slate-500'}`}></div>
            <span className={`text-sm font-medium ${isMarketHours ? 'text-green-400' : 'text-slate-300'}`}>
              {isMarketHours ? 'Market Open' : 'Market Closed'}
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">
              • {currentDateTime ? formatDisplayDate(currentDateTime) : formatDisplayDate(currentTime)}
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline ml-2">
              • {currentDateTime ? formatDisplayTime(currentDateTime) : formatDisplayTime(currentTime)} IST
            </span>
          </div>
          
          {/* Mobile date/time display */}
          <div className="flex sm:hidden">
            <span className="text-slate-500 text-xs">
              {currentDateTime ? formatDisplayDate(currentDateTime) : formatDisplayDate(currentTime)}
            </span>
            <span className="text-slate-500 text-xs ml-2">
              {currentDateTime ? formatDisplayTime(currentDateTime) : formatDisplayTime(currentTime)} IST
            </span>
          </div>
          
          {/* Practice mode indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="hidden sm:inline">Practice Mode</span>
            <span className="sm:hidden">Practice</span>
          </div>
        </div>
        
        {/* Rolling ticker - show on all screen sizes */}
        <div className="mt-2 pt-2 border-t border-slate-700/30 overflow-hidden">
          <motion.div
            animate={{ x: [0, "-50%"] }}
            transition={{
              x: { 
                duration: 25, 
                repeat: Infinity, 
                ease: "linear",
                repeatType: "loop"
              }
            }}
            className="flex whitespace-nowrap"
            style={{ width: "200%" }}
          >
            {[...(isMarketHours ? openMarketTexts : disclaimerTexts), ...(isMarketHours ? openMarketTexts : disclaimerTexts), ...(isMarketHours ? openMarketTexts : disclaimerTexts), ...(isMarketHours ? openMarketTexts : disclaimerTexts)].map((text, index) => (
              <span key={index} className="text-slate-400 text-xs mx-6 whitespace-nowrap">
                {text}
                {index < (isMarketHours ? openMarketTexts : disclaimerTexts).length * 4 - 1 && " • "}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarketClosedDisclaimer;