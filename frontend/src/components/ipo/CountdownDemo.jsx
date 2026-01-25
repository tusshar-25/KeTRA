import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIPOCountdown } from '../hooks/useCountdown';

const CountdownDemo = () => {
  const [demoTimeline, setDemoTimeline] = useState({
    symbol: 'BOAT',
    status: 'applied',
    timeline: {
      applied: { time: new Date().toISOString(), completed: true },
      allotment: { 
        time: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        completed: false,
        result: 'Pending'
      },
      listing: { 
        time: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
        completed: false,
        price: null
      },
      close: { 
        time: new Date(Date.now() + 240000).toISOString(), // 4 minutes from now
        completed: false
      }
    }
  });

  const countdownData = useIPOCountdown(demoTimeline);

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">
        ⚡ Accelerated IPO Countdown Demo
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Symbol:</span>
          <span className="text-white font-medium">{demoTimeline.symbol}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Status:</span>
          <span className="text-green-400 font-medium">{demoTimeline.status}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Next Event:</span>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{countdownData.icon}</span>
              <div>
                <p className={`font-medium ${countdownData.color}`}>
                  {countdownData.nextEvent?.title}
                </p>
                <p className="text-xs text-slate-400">
                  {countdownData.nextEvent?.message}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {countdownData.countdown && !countdownData.countdown.completed && (
          <div className="text-center">
            <motion.div
              key={countdownData.countdown.totalSeconds}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-indigo-400"
            >
              {countdownData.countdown.short}
            </motion.div>
            <p className="text-slate-400 text-sm mt-2">remaining</p>
          </div>
        )}
        
        {countdownData.countdown.completed && (
          <div className="text-center">
            <p className="text-green-400 font-medium">✅ Completed</p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Applied</span>
            <span>Allotment</span>
            <span>Listing</span>
            <span>Complete</span>
          </div>
          
          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="w-1/4 bg-green-500"></div>
              <div className={`w-1/4 ${countdownData.progress.allotment ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              <div className={`w-1/4 ${countdownData.progress.listing ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              <div className={`w-1/4 ${countdownData.progress.close ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            </div>
          </div>
        </div>
        
        {/* Timeline Info */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <h4 className="text-white font-medium mb-3">Timeline:</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Applied:</span>
              <span className="text-green-400">✅ Completed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Allotment:</span>
              <span className={countdownData.progress.allotment ? 'text-green-400' : 'text-slate-400'}>
                {countdownData.progress.allotment ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Listing:</span>
              <span className={countdownData.progress.listing ? 'text-green-400' : 'text-slate-400'}>
                {countdownData.progress.listing ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auto Close:</span>
              <span className={countdownData.progress.close ? 'text-green-400' : 'text-slate-400'}>
                {countdownData.progress.close ? '✅ Completed' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownDemo;
