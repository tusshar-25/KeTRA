import { useState, useEffect, useCallback } from 'react';

export const useRealTimeCountdown = (targetTime, onComplete = null) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    completed: false
  });

  const calculateCountdown = useCallback(() => {
    const now = new Date().getTime();
    const target = new Date(targetTime).getTime();
    const difference = target - now;

    if (difference <= 0) {
      setCountdown({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        completed: true
      });
      
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setCountdown({
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor(difference / 1000),
      completed: false
    });
  }, [targetTime, onComplete]);

  useEffect(() => {
    calculateCountdown();

    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (value, label) => {
    return value > 0 ? `${value}${label}` : '';
  };

  const getFormattedCountdown = () => {
    if (countdown.completed) return 'Completed';

    const parts = [];
    
    if (countdown.days > 0) {
      parts.push(formatTime(countdown.days, 'd'));
    }
    
    if (countdown.hours > 0) {
      parts.push(formatTime(countdown.hours, 'h'));
    }
    
    if (countdown.minutes > 0) {
      parts.push(formatTime(countdown.minutes, 'm'));
    }
    
    if (countdown.seconds > 0 || parts.length === 0) {
      parts.push(formatTime(countdown.seconds, 's'));
    }

    return parts.join(' ');
  };

  const getShortCountdown = () => {
    if (countdown.completed) return 'Completed';
    
    if (countdown.totalSeconds >= 60) {
      const minutes = Math.floor(countdown.totalSeconds / 60);
      const seconds = countdown.totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${countdown.seconds}s`;
  };

  return {
    ...countdown,
    formatted: getFormattedCountdown(),
    short: getShortCountdown(),
    isUrgent: countdown.totalSeconds <= 60 && !countdown.completed,
    isVeryUrgent: countdown.totalSeconds <= 10 && !countdown.completed
  };
};

export const useIPOCountdown = (timeline) => {
  const [currentStage, setCurrentStage] = useState('applied');
  const [nextEvent, setNextEvent] = useState(null);

  const getNextEvent = useCallback(() => {
    if (!timeline) return null;

    const now = new Date();
    
    // Check allotment
    if (!timeline.timeline.allotment.completed) {
      const allotmentTime = new Date(timeline.timeline.allotment.time);
      if (allotmentTime > now) {
        return {
          type: 'allotment',
          targetTime: timeline.timeline.allotment.time,
          title: 'Allotment Result',
          message: 'Allotment will be announced'
        };
      }
    }

    // Check listing
    if (timeline.timeline.allotment.completed && !timeline.timeline.listing.completed) {
      const listingTime = new Date(timeline.timeline.listing.time);
      if (listingTime > now) {
        return {
          type: 'listing',
          targetTime: timeline.timeline.listing.time,
          title: 'Listing Announcement',
          message: 'Listing price will be announced'
        };
      }
    }

    // Check auto-close
    if (timeline.timeline.listing.completed && !timeline.timeline.close.completed) {
      const closeTime = new Date(timeline.timeline.close.time);
      if (closeTime > now) {
        return {
          type: 'close',
          targetTime: timeline.timeline.close.time,
          title: 'Auto Close',
          message: 'IPO will be automatically closed'
        };
      }
    }

    return null;
  }, [timeline]);

  useEffect(() => {
    const event = getNextEvent();
    setNextEvent(event);
    
    if (event) {
      setCurrentStage(event.type);
    } else {
      setCurrentStage('completed');
    }
  }, [timeline]);

  const countdown = useRealTimeCountdown(
    nextEvent?.targetTime,
    () => {
      // Refresh the next event when current one completes
      const event = getNextEvent();
      setNextEvent(event);
      if (event) {
        setCurrentStage(event.type);
      } else {
        setCurrentStage('completed');
      }
    }
  );

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'allotment': return '🎯';
      case 'listing': return '📈';
      case 'close': return '🔒';
      case 'completed': return '✅';
      default: return '⏳';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'allotment': return 'text-blue-400';
      case 'listing': return 'text-green-400';
      case 'close': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-slate-400';
    }
  };

  return {
    currentStage,
    nextEvent,
    countdown,
    icon: getStageIcon(currentStage),
    color: getStageColor(currentStage),
    isCompleted: currentStage === 'completed',
    progress: {
      applied: true,
      allotment: timeline?.timeline?.allotment?.completed || false,
      listing: timeline?.timeline?.listing?.completed || false,
      close: timeline?.timeline?.close?.completed || false
    }
  };
};
