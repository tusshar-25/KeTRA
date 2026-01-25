import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIPOCountdown } from "../../hooks/useCountdown";

const IPOCountdown = ({ symbol, timeline, onStatusChange }) => {
  const countdownData = useIPOCountdown(timeline);
  const [status, setStatus] = useState(timeline?.status || 'applied');

  useEffect(() => {
    if (timeline?.status !== status) {
      setStatus(timeline.status);
      if (onStatusChange) {
        onStatusChange({ ...countdownData, status: timeline.status });
      }
    }
  }, [timeline?.status, onStatusChange]);

  if (!countdownData || !timeline) return null;

  const getNextStageInfo = () => {
    const nextAction = countdownData.nextAction;
    
    // Handle case where there's no next event yet
    if (!nextAction) {
      return {
        icon: '⏳',
        title: 'Processing...',
        message: 'Initializing countdown...',
        color: 'text-slate-400'
      };
    }
    
    switch (nextAction.type) {
      case 'allotment':
        return {
          icon: '🎯',
          title: 'Allotment Result',
          message: 'Allotment will be announced',
          color: 'text-blue-400'
        };
      case 'listing':
        return {
          icon: '📈',
          title: 'Listing Announcement',
          message: 'Listing price will be announced',
          color: 'text-green-400'
        };
      case 'withdraw':
        return {
          icon: '💰',
          title: 'Withdraw Available',
          message: 'You can withdraw your funds',
          color: 'text-yellow-400'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'Process Completed',
          message: 'IPO process completed',
          color: 'text-gray-400'
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing...',
          message: 'Initializing countdown...',
          color: 'text-slate-400'
        };
    }
  };

  const nextStage = getNextStageInfo();
  const nextAction = countdownData.nextEvent;
  
  if (!nextStage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{nextStage.icon}</span>
          <div>
            <h4 className="text-white font-medium">{nextStage.title}</h4>
            <p className="text-slate-400 text-sm">{nextStage.message}</p>
          </div>
        </div>
        
        {nextAction?.countdown && !nextAction.countdown.completed ? (
          <div className="text-right">
            <div className={`text-2xl font-bold ${nextStage.color}`}>
              {nextAction.countdown.short || 'Loading...'}
            </div>
            <p className="text-slate-400 text-xs">remaining</p>
          </div>
        ) : (
          <div className="text-right">
            <div className={`text-2xl font-bold ${nextStage.color}`}>
              {nextAction?.countdown?.short || '--:--'}
            </div>
            <p className="text-slate-400 text-xs">
              {nextAction?.countdown?.completed ? 'Completed' : 'Calculating...'}
            </p>
          </div>
        )}
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
            <div className={`w-1/4 ${countdownData.progress.allotment ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            
            {/* Listing Stage */}
            <div className={`w-1/4 ${countdownData.progress.listing ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            
            {/* Complete Stage */}
            <div className={`w-1/4 ${countdownData.progress.close ? 'bg-green-500' : 'bg-slate-600'}`}></div>
          </div>
        </div>
      </div>

      {/* Detailed Timeline */}
      <div className="mt-4 space-y-2">
        {countdownData.progress.allotment && timeline?.timeline?.allotment?.result && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Allotment Result:</span>
            <span className={`font-medium ${
              timeline.timeline.allotment.result === 'Allotted' ? 'text-green-400' : 'text-red-400'
            }`}>
              {timeline.timeline.allotment.result}
            </span>
          </div>
        )}
        
        {countdownData.progress.listing && timeline?.timeline?.listing?.price && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Listing Price:</span>
            <span className="text-green-400 font-medium">₹{timeline.timeline.listing.price}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default IPOCountdown;
