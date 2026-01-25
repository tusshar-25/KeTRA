import { useSimpleCountdown } from '../../hooks/useSimpleCountdown';
import { useState, useEffect } from 'react';

const SimpleIPOCountdown = ({ symbol, timeline, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState(timeline?.status || 'applied');
  const [nextEventAfterCompletion, setNextEventAfterCompletion] = useState(null);
  
  if (!timeline || !timeline.timeline) return null;

  // Get the next event time
  const getNextEventTime = () => {
    const now = new Date();
    
    // Check allotment
    if (!timeline.timeline.allotment.completed) {
      const allotmentTime = new Date(timeline.timeline.allotment.time);
      if (allotmentTime > now) {
        return {
          time: timeline.timeline.allotment.time,
          type: 'allotment',
          title: 'Allotment Result',
          message: 'Allotment will be announced',
          icon: '🎯',
          color: 'text-blue-400'
        };
      }
    }

    // Check listing
    if (timeline.timeline.allotment.completed && !timeline.timeline.listing.completed) {
      const listingTime = new Date(timeline.timeline.listing.time);
      if (listingTime > now) {
        return {
          time: timeline.timeline.listing.time,
          type: 'listing',
          title: 'Listing Announcement',
          message: 'Listing price will be announced',
          icon: '📈',
          color: 'text-green-400'
        };
      }
    }

    // Check auto-close
    if (timeline.timeline.listing.completed && !timeline.timeline.close.completed) {
      const closeTime = new Date(timeline.timeline.close.time);
      if (closeTime > now) {
        return {
          time: timeline.timeline.close.time,
          type: 'close',
          title: 'Auto Close',
          message: 'IPO will be automatically closed',
          icon: '🔒',
          color: 'text-yellow-400'
        };
      }
    }

    return {
      time: null,
      type: 'completed',
      title: 'Process Completed',
      message: 'IPO process completed',
      icon: '✅',
      color: 'text-gray-400'
    };
  };

  const nextEvent = getNextEventTime();
  const countdown = useSimpleCountdown(nextEvent?.time);

  // Update nextEventAfterCompletion when timeline changes
  useEffect(() => {
    const now = new Date();
    
    // Check if listing is not completed
    if (timeline.timeline.allotment.completed && !timeline.timeline.listing.completed) {
      const listingTime = new Date(timeline.timeline.listing.time);
      if (listingTime > now) {
        setNextEventAfterCompletion({
          time: timeline.timeline.listing.time,
          type: 'listing',
          title: 'Listing Announcement',
          message: 'Listing price will be announced',
          icon: '📈',
          color: 'text-green-400'
        });
        return;
      }
    }
    
    // Check if close is not completed
    if (timeline.timeline.listing.completed && !timeline.timeline.close.completed) {
      const closeTime = new Date(timeline.timeline.close.time);
      if (closeTime > now) {
        setNextEventAfterCompletion({
          time: timeline.timeline.close.time,
          type: 'close',
          title: 'Auto Close',
          message: 'IPO will be automatically closed',
          icon: '🔒',
          color: 'text-yellow-400'
        });
        return;
      }
    }
    
    setNextEventAfterCompletion(null);
  }, [timeline]);

  const countdownAfterCompletion = useSimpleCountdown(nextEventAfterCompletion?.time);

  // Handle completed state with results
  if (!nextEvent || !nextEvent.time) {
    const isAllotted = timeline.timeline.allotment.result === 'Allotted';
    const listingPrice = timeline.timeline.listing.price;
    const issuePrice = 14220; // This should come from the IPO data
    
    const calculateProfitLoss = () => {
      if (!isAllotted || !listingPrice) return null;
      const profitPerShare = listingPrice - issuePrice;
      const totalProfit = profitPerShare * 66; // 66 shares applied
      return {
        profitPerShare,
        totalProfit,
        percentage: ((profitPerShare / issuePrice) * 100).toFixed(2)
      };
    };

    const profitLoss = calculateProfitLoss();

    // For completed applications, check if there are any remaining events
    const checkForRemainingEvents = () => {
      const now = new Date();
      
      // Check if listing is not completed
      if (timeline.timeline.allotment.completed && !timeline.timeline.listing.completed) {
        const listingTime = new Date(timeline.timeline.listing.time);
        if (listingTime > now) {
          return {
            time: timeline.timeline.listing.time,
            type: 'listing',
            title: 'Listing Announcement',
            message: 'Listing price will be announced',
            icon: '📈',
            color: 'text-green-400'
          };
        }
      }
      
      // Check if close is not completed
      if (timeline.timeline.listing.completed && !timeline.timeline.close.completed) {
        const closeTime = new Date(timeline.timeline.close.time);
        if (closeTime > now) {
          return {
            time: timeline.timeline.close.time,
            type: 'close',
            title: 'Auto Close',
            message: 'IPO will be automatically closed',
            icon: '🔒',
            color: 'text-yellow-400'
          };
        }
      }
      
      return null;
    };

    const remainingEvent = checkForRemainingEvents();
    const countdownAfterCompletion = useSimpleCountdown(remainingEvent?.time);

    // If there's a remaining event, show countdown for it
    if (remainingEvent && remainingEvent.time && !countdownAfterCompletion.isCompleted) {
      return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{remainingEvent.icon}</span>
              <div>
                <h4 className="text-white font-medium">{remainingEvent.title}</h4>
                <p className="text-slate-400 text-sm">{remainingEvent.message}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${remainingEvent.color}`}>
                {countdownAfterCompletion.formatted}
              </div>
              <p className="text-slate-400 text-xs">
                {countdownAfterCompletion.isCompleted ? 'Completed' : 'remaining'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Applied</span>
              <span>Allotment</span>
              <span>Listing</span>
              <span>Complete</span>
            </div>
            
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                {/* Applied Stage */}
                <div className="w-1/4 bg-green-500"></div>
                
                {/* Allotment Stage */}
                <div className={`w-1/4 ${timeline.timeline.allotment.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                
                {/* Listing Stage */}
                <div className={`w-1/4 ${timeline.timeline.listing.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                
                {/* Complete Stage */}
                <div className={`w-1/4 ${timeline.timeline.close.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              </div>
            </div>
          </div>

          {/* Detailed Timeline */}
          <div className="mt-4 space-y-2">
            {timeline.timeline.allotment.completed && timeline.timeline.allotment.result && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Allotment Result:</span>
                <span className={`font-medium ${
                  timeline.timeline.allotment.result === 'Allotted' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {timeline.timeline.allotment.result}
                </span>
              </div>
            )}
            
            {timeline.timeline.listing.completed && timeline.timeline.listing.price && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Listing Price:</span>
                <span className="text-green-400 font-medium">₹{timeline.timeline.listing.price}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If no next events, show final completed state with consistent theme
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isAllotted ? '🎉' : '❌'}</span>
            <div>
              <h4 className="text-white font-medium">
                {isAllotted ? 'Allotted!' : 'Not Allotted'}
              </h4>
              <p className="text-slate-400 text-sm">
                {isAllotted ? 'Congratulations!' : 'Better luck next time'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${isAllotted ? 'text-green-400' : 'text-red-400'}`}>
              {isAllotted ? 'Allotted' : 'Not Allotted'}
            </div>
            <p className="text-slate-400 text-xs">final result</p>
          </div>
        </div>

        {/* Progress Bar - Keep consistent with countdown theme */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Applied</span>
            <span>Allotment</span>
            <span>Listing</span>
            <span>Complete</span>
          </div>
          
          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              {/* Applied Stage */}
              <div className="w-1/4 bg-green-500"></div>
              
              {/* Allotment Stage */}
              <div className="w-1/4 bg-green-500"></div>
              
              {/* Listing Stage */}
              <div className="w-1/4 bg-green-500"></div>
              
              {/* Complete Stage */}
              <div className="w-1/4 bg-green-500"></div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {isAllotted && (
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <h5 className="text-sm font-semibold text-slate-100 mb-2">Allotment Details</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Shares Allotted:</span>
                  <span className="text-green-400 font-medium">66 shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Issue Price:</span>
                  <span className="text-slate-300 font-medium">₹{issuePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Listing Price:</span>
                  <span className="text-green-400 font-medium">₹{listingPrice || 'TBD'}</span>
                </div>
                {profitLoss && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit/Loss:</span>
                      <span className={`font-medium ${profitLoss.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{profitLoss.totalProfit} ({profitLoss.percentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit/Loss per Share:</span>
                      <span className={`font-medium ${profitLoss.profitPerShare >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{profitLoss.profitPerShare}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!isAllotted && (
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <h5 className="text-sm font-semibold text-slate-100 mb-2">Application Details</h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Applied:</span>
                <span className="text-slate-300 font-medium">₹{issuePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-red-400 font-medium">Not Allotted</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Refund:</span>
                <span className="text-green-400 font-medium">Full refund processed</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Keep consistent theme */}
        <div className="mt-4 space-y-2">
          {isAllotted && listingPrice && (
            <button className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-500/30">
              View in Portfolio
            </button>
          )}
          
          {!isAllotted && (
            <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30">
              Apply for Other IPOs
            </button>
          )}
          
          <button 
            onClick={() => onStatusChange && onStatusChange({ status: 'view-details' })}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all duration-300 border border-slate-600/30"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{nextEvent.icon}</span>
          <div>
            <h4 className="text-white font-medium">{nextEvent.title}</h4>
            <p className="text-slate-400 text-sm">{nextEvent.message}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${nextEvent.color}`}>
            {countdown.formatted}
          </div>
          <p className="text-slate-400 text-xs">
            {countdown.isCompleted ? 'Completed' : 'remaining'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Applied</span>
          <span>Allotment</span>
          <span>Listing</span>
          <span>Complete</span>
        </div>
        
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            {/* Applied Stage */}
            <div className="w-1/4 bg-green-500"></div>
            
            {/* Allotment Stage */}
            <div className={`w-1/4 ${timeline.timeline.allotment.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            
            {/* Listing Stage */}
            <div className={`w-1/4 ${timeline.timeline.listing.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            
            {/* Complete Stage */}
            <div className={`w-1/4 ${timeline.timeline.close.completed ? 'bg-green-500' : 'bg-slate-600'}`}></div>
          </div>
        </div>
      </div>

      {/* Detailed Timeline */}
      <div className="mt-4 space-y-2">
        {timeline.timeline.allotment.completed && timeline.timeline.allotment.result && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Allotment Result:</span>
            <span className={`font-medium ${
              timeline.timeline.allotment.result === 'Allotted' ? 'text-green-400' : 'text-red-400'
            }`}>
              {timeline.timeline.allotment.result}
            </span>
          </div>
        )}
        
        {timeline.timeline.listing.completed && timeline.timeline.listing.price && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Listing Price:</span>
            <span className="text-green-400 font-medium">₹{timeline.timeline.listing.price}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleIPOCountdown;
